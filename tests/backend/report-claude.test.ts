import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFixtures } from "../../src/lib/fixtures";
import { createRecord } from "../../src/lib/server/candidate/model";

const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: mocks.create };
  },
}));
import { generatePracticalReport } from "../../src/lib/server/reports/claude";

function sample() {
  const vacancy = createFixtures()[0];
  vacancy.assessment!.approvedAt = new Date().toISOString();
  const record = createRecord(
    crypto.randomUUID(),
    {
      vacancyId: vacancy.id,
      candidateId: vacancy.candidates[0].id,
      requestId: crypto.randomUUID(),
      workspaceRevision: 1,
    },
    { revision: 1, vacancies: [vacancy] },
    Date.now(),
  ).record;
  record.status = "submitted";
  record.completedAt = new Date().toISOString();
  record.answers[0] = {
    answer: "Dəqiq sübutlu cavab.",
    savedAt: new Date().toISOString(),
  };
  const content = {
    summary: "İlkin qiymətləndirmə.",
    limitations: ["Canlı yoxlama lazımdır."],
    criteria: record.assessment.criteria.map((criterion) => ({
      criterion,
      level: "partial",
      evidence: [{ stage: 1, quote: "Dəqiq sübutlu cavab." }],
      reason: "Qismən göstərilib.",
      question: "Həllini izah et.",
    })),
  };
  return { record, content };
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("ANTHROPIC_API_KEY", "secret-not-real");
  vi.stubEnv("ANTHROPIC_MODEL", "test-model");
});
afterEach(() => vi.unstubAllEnvs());

describe("practical Claude output", () => {
  it("sends only the frozen task and accepted answers, returns server metadata", async () => {
    const { record, content } = sample();
    mocks.create.mockResolvedValue({
      stop_reason: "end_turn",
      content: [{ type: "text", text: JSON.stringify(content) }],
    });
    const result = await generatePracticalReport(record);
    expect(result.source).toBe("claude");
    expect(result.model).toBe("test-model");
    const sent = JSON.parse(mocks.create.mock.calls[0][0].messages[0].content);
    expect(mocks.create.mock.calls[0][0].output_config.format.type).toBe(
      "json_schema",
    );
    expect(
      mocks.create.mock.calls[0][0].output_config.format.schema.properties,
    ).toHaveProperty("criteria");
    expect(sent.stages[0].acceptedAnswer).toBe(record.answers[0].answer);
    expect(sent.criteria).toEqual(record.assessment.criteria);
    expect(sent).not.toHaveProperty("cv");
    expect(sent).not.toHaveProperty("secretHash");
    expect(sent).not.toHaveProperty("owner");
  });
  it("never calls the provider when the model/key is absent", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { record } = sample();
    await expect(generatePracticalReport(record)).rejects.toMatchObject({
      status: 503,
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("rejects fabricated quotes and hides provider internals", async () => {
    const { record, content } = sample();
    content.criteria[0].evidence[0].quote = "Invented quote";
    mocks.create.mockResolvedValue({
      stop_reason: "end_turn",
      content: [{ type: "text", text: JSON.stringify(content) }],
    });
    await expect(generatePracticalReport(record)).rejects.toMatchObject({
      status: 502,
    });
    mocks.create.mockRejectedValue(new Error("secret-not-real"));
    const error = await generatePracticalReport(record).catch(
      (error: Error) => error,
    );
    expect((error as Error).message).not.toContain("secret-not-real");
  });
  it("does not accept truncated reports", async () => {
    const { record, content } = sample();
    mocks.create.mockResolvedValue({
      stop_reason: "max_tokens",
      content: [{ type: "text", text: JSON.stringify(content) }],
    });
    await expect(generatePracticalReport(record)).rejects.toMatchObject({
      status: 502,
    });
  });
});
