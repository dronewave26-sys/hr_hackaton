import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFixtures, savedDemoAnalysis } from "../../src/lib/fixtures";

const mocks = vi.hoisted(() => ({ create: vi.fn(), construct: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: mocks.create };
    constructor(options: unknown) {
      mocks.construct(options);
    }
  },
}));
import { analyzeCV } from "../../src/lib/server/claude";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("ANTHROPIC_API_KEY", "test-secret-not-a-real-key");
  vi.stubEnv("ANTHROPIC_MODEL", "test-configured-model");
});
afterEach(() => vi.unstubAllEnvs());

describe("Claude CV analysis", () => {
  it("requires both server-side key and explicit model", async () => {
    vi.stubEnv("ANTHROPIC_MODEL", "");
    const vacancy = createFixtures()[0];
    await expect(
      analyzeCV(vacancy, vacancy.candidates[0]),
    ).rejects.toMatchObject({ status: 503 });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("checks the returned citations and labels a valid result as live Claude", async () => {
    const vacancy = createFixtures()[0];
    const candidate = vacancy.candidates[0];
    mocks.create.mockResolvedValue({
      stop_reason: "end_turn",
      content: [
        {
          type: "text",
          text: JSON.stringify(savedDemoAnalysis(vacancy, candidate.id)),
        },
      ],
    });
    const result = await analyzeCV(vacancy, candidate);
    expect(result.source).toBe("claude");
    expect(result.model).toBe("test-configured-model");
    expect(mocks.construct).toHaveBeenCalledWith({
      maxRetries: 0,
      timeout: 45000,
    });
    const input = mocks.create.mock.calls[0][0];
    expect(input.output_config.format.type).toBe("json_schema");
    expect(input.output_config.format.schema.properties).toHaveProperty(
      "items",
    );
    expect(JSON.parse(input.messages[0].content)).toEqual({
      vacancy: {
        title: vacancy.title,
        description: vacancy.description,
        skills: vacancy.skills,
      },
      cv: candidate.cv,
    });
    expect(input.messages[0].content).not.toContain(vacancy.candidates[1].name);
  });
  it("rejects fabricated source evidence", async () => {
    const vacancy = createFixtures()[0];
    const candidate = vacancy.candidates[0];
    const answer = savedDemoAnalysis(vacancy, candidate.id);
    answer.items[0].quote = "This sentence is not in the supplied CV.";
    mocks.create.mockResolvedValue({
      stop_reason: "end_turn",
      content: [{ type: "text", text: JSON.stringify(answer) }],
    });
    await expect(analyzeCV(vacancy, candidate)).rejects.toMatchObject({
      status: 502,
    });
  });
  it("rejects truncated responses even if their text resembles JSON", async () => {
    const vacancy = createFixtures()[0];
    mocks.create.mockResolvedValue({
      stop_reason: "max_tokens",
      content: [{ type: "text", text: "{}" }],
    });
    await expect(
      analyzeCV(vacancy, vacancy.candidates[0]),
    ).rejects.toMatchObject({ status: 502 });
  });
  it("does not expose raw provider details on error", async () => {
    const vacancy = createFixtures()[0];
    mocks.create.mockRejectedValue(
      new Error("Request failed with test-secret-not-a-real-key"),
    );
    const error = await analyzeCV(vacancy, vacancy.candidates[0]).catch(
      (error: Error) => error,
    );
    expect(error).toHaveProperty("status", 502);
    expect((error as Error).message).not.toContain(
      "test-secret-not-a-real-key",
    );
  });
});
