import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { emptyWorkspace, type Workspace } from "../../src/lib/domain";
import { createFixtures } from "../../src/lib/fixtures";
import { AppError } from "../../src/lib/server/errors";

const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  origin: vi.fn(),
  analyze: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/context", async () => ({
  ...(await import("../../src/lib/server/errors")),
  context: mocks.context,
  requireSameOrigin: mocks.origin,
}));
vi.mock("@/lib/server/claude", () => ({ analyzeCV: mocks.analyze }));
import { GET, POST } from "../../src/app/api/workspace/route";

let state: Workspace;
const config = { storage: "local", aiReady: false, model: null, account: null };
const post = (body: object) =>
  POST(
    new NextRequest("http://localhost/api/workspace", {
      method: "POST",
      headers: {
        origin: "http://localhost",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  state = emptyWorkspace();
  mocks.context.mockResolvedValue({
    config,
    get: async () => structuredClone(state),
    change: async (transform: (value: Workspace) => Workspace) => {
      const next = transform(structuredClone(state));
      next.revision = state.revision + 1;
      state = next;
      return structuredClone(state);
    },
  });
  mocks.origin.mockImplementation(() => {});
});

describe("workspace API contract", () => {
  it("returns private state and actual configuration", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/workspace"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.json()).toEqual({ workspace: state, config });
  });
  it("returns a 403 before reading state if origin validation fails", async () => {
    mocks.origin.mockImplementation(() => {
      throw new AppError("Forbidden", 403);
    });
    expect((await post({ type: "seed", revision: 0 })).status).toBe(403);
    expect(mocks.context).not.toHaveBeenCalled();
  });
  it("seeds two vacancies once even when called again", async () => {
    expect((await post({ type: "seed", revision: 0 })).status).toBe(200);
    expect(state.vacancies).toHaveLength(2);
    expect((await post({ type: "seed", revision: 1 })).status).toBe(200);
    expect(state.vacancies).toHaveLength(2);
  });
  it("rejects a stale revision without mutating data", async () => {
    state.revision = 2;
    expect((await post({ type: "seed", revision: 1 })).status).toBe(409);
    expect(state).toEqual({ revision: 2, vacancies: [] });
  });
  it("rejects non-existent and foreign object IDs", async () => {
    const response = await post({
      type: "addCandidate",
      revision: 0,
      vacancyId: crypto.randomUUID(),
      name: "Demo",
      cv: "A fictional CV with sufficient detail for this test.",
    });
    expect(response.status).toBe(404);
    expect(state.revision).toBe(0);
  });
  it("does not trust client-supplied identity or demo provenance", async () => {
    const response = await post({
      type: "create",
      revision: 0,
      title: "Demo role",
      department: "Demo",
      description: "A fictional description long enough for schema validation.",
      skills: ["Analysis"],
      owner_id: "other-person",
      demoKey: "sales",
    });
    expect(response.status).toBe(200);
    expect(state.vacancies[0]).not.toHaveProperty("owner_id");
    expect(state.vacancies[0].demoKey).toBeUndefined();
  });
  it("loads a saved demo with its explicit provenance and validated quotes", async () => {
    state.vacancies = createFixtures();
    const vacancy = state.vacancies[0];
    const response = await post({
      type: "analyze",
      revision: 0,
      vacancyId: vacancy.id,
      candidateId: vacancy.candidates[0].id,
      mode: "demo",
    });
    expect(response.status).toBe(200);
    expect(state.vacancies[0].candidates[0].analysis?.source).toBe(
      "saved-demo",
    );
    expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it("rejects altered fixture CVs instead of reusing the demo analysis", async () => {
    state.vacancies = createFixtures();
    const vacancy = state.vacancies[0];
    vacancy.candidates[0].cv += " Changed.";
    expect(
      (
        await post({
          type: "analyze",
          revision: 0,
          vacancyId: vacancy.id,
          candidateId: vacancy.candidates[0].id,
          mode: "demo",
        })
      ).status,
    ).toBe(400);
    expect(state.vacancies[0].candidates[0].analysis).toBeUndefined();
  });
  it("retains CVs when Claude fails", async () => {
    state.vacancies = createFixtures();
    const vacancy = state.vacancies[0];
    const cv = vacancy.candidates[0].cv;
    mocks.analyze.mockRejectedValue(new AppError("Provider unavailable", 502));
    expect(
      (
        await post({
          type: "analyze",
          revision: 0,
          vacancyId: vacancy.id,
          candidateId: vacancy.candidates[0].id,
          mode: "live",
        })
      ).status,
    ).toBe(502);
    expect(state.vacancies[0].candidates[0].cv).toBe(cv);
    expect(state.revision).toBe(0);
  });
  it("rejects an AI result if another mutation happened during the request", async () => {
    state.vacancies = createFixtures();
    const vacancy = state.vacancies[0];
    mocks.analyze.mockImplementation(async () => {
      state.revision += 1;
      return { items: [], summary: "Changed" };
    });
    expect(
      (
        await post({
          type: "analyze",
          revision: 0,
          vacancyId: vacancy.id,
          candidateId: vacancy.candidates[0].id,
          mode: "live",
        })
      ).status,
    ).toBe(409);
    expect(state.vacancies[0].candidates[0].analysis).toBeUndefined();
  });
  it("clears the prior approval when an assessment is saved as draft", async () => {
    state.vacancies = createFixtures();
    const vacancy = state.vacancies[0];
    vacancy.assessment!.approvedAt = new Date().toISOString();
    const response = await post({
      type: "saveAssessment",
      revision: 0,
      vacancyId: vacancy.id,
      assessment: vacancy.assessment,
      approve: false,
    });
    expect(response.status).toBe(200);
    expect(state.vacancies[0].assessment?.approvedAt).toBeUndefined();
  });
});
