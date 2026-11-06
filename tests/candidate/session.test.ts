import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { randomUUID } from "node:crypto";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createFixtures } from "@/lib/fixtures";
import {
  authorize,
  createRecord,
  expire,
  hash,
  transition,
  view,
} from "@/lib/server/candidate/model";
import {
  LocalCandidateStore,
  SupabaseCandidateStore,
  storeFor,
} from "@/lib/server/candidate/store";
import { mutationSchema } from "@/lib/candidate/contracts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
const now = Date.parse("2026-11-06T12:00:00Z");
function fixture(index = 0) {
  const vacancies = createFixtures();
  vacancies[index].assessment!.approvedAt = new Date(now).toISOString();
  const workspace = { revision: 1, vacancies };
  const input = {
    vacancyId: vacancies[index].id,
    candidateId: vacancies[index].candidates[0].id,
    workspaceRevision: 1,
    requestId: randomUUID(),
  };
  return { workspace, input, ...createRecord("owner", input, workspace, now) };
}
function action(
  record: ReturnType<typeof fixture>["record"],
  type: "start" | "save" | "advance" | "submit",
  answer = "cavab",
) {
  return mutationSchema.parse({
    type,
    invitationId: record.id,
    requestId: randomUUID(),
    revision: record.revision,
    ...(type === "start" ? {} : { stage: record.currentStage, answer }),
  });
}
const dirs: string[] = [];
afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(
    dirs.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});
describe("candidate state and isolation", () => {
  it("requires approval, matching candidate and workspace revision", () => {
    const { workspace, input } = fixture();
    expect(() =>
      createRecord("owner", { ...input, workspaceRevision: 0 }, workspace, now),
    ).toThrow();
    expect(() =>
      createRecord(
        "owner",
        { ...input, candidateId: workspace.vacancies[1].candidates[0].id },
        workspace,
        now,
      ),
    ).toThrow();
    delete workspace.vacancies[0].assessment!.approvedAt;
    expect(() => createRecord("owner", input, workspace, now)).toThrow();
  });
  it("snapshots assessment and keeps ready DTO free of future content and CVs", () => {
    const { record, workspace, token } = fixture();
    workspace.vacancies[0].assessment!.stages[0] = "changed";
    expect(record.assessment.stages[0]).not.toBe("changed");
    const publicData = view(record, now);
    expect(publicData.unlockedStages).toEqual([]);
    expect(publicData.materials).toBeNull();
    expect(JSON.stringify(publicData)).not.toContain(
      record.assessment.stages[2],
    );
    expect(JSON.stringify(record)).not.toContain(token);
    expect(JSON.stringify(record)).not.toContain(
      workspace.vacancies[0].candidates[0].cv,
    );
  });
  it("separates sales and SOC", () => {
    const sales = fixture(0).record,
      soc = fixture(1).record;
    expect(sales.vacancyTitle).not.toEqual(soc.vacancyTitle);
    expect(sales.assessment.materials).not.toEqual(soc.assessment.materials);
  });
  it("starts once and returns current view for retries, without resetting time", () => {
    const { record } = fixture();
    const start = action(record, "start");
    transition(record, start, now);
    transition(record, action(record, "save"), now + 1000);
    transition(record, start, now + 2000);
    expect(record.revision).toBe(2);
    expect(record.startedAt).toBe(new Date(now).toISOString());
    expect(view(record, now).unlockedStages).toHaveLength(1);
    transition(record, action(record, "start"), now + 5000);
    expect(record.revision).toBe(2);
  });
  it("blocks future and locked stages, stale revisions and request reuse", () => {
    const { record } = fixture();
    transition(record, action(record, "start"), now);
    const save = action(record, "save");
    transition(record, save, now);
    expect(() =>
      transition(record, { ...save, requestId: randomUUID() }, now),
    ).toThrow();
    expect(() =>
      transition(
        record,
        { ...save, type: "save", stage: 1, answer: "different" },
        now,
      ),
    ).toThrow();
    expect(() =>
      transition(
        record,
        { ...action(record, "save"), type: "save", stage: 3, answer: "future" },
        now,
      ),
    ).toThrow();
    transition(record, action(record, "advance"), now);
    expect(() =>
      transition(
        record,
        { ...action(record, "save"), type: "save", stage: 1, answer: "locked" },
        now,
      ),
    ).toThrow();
  });
  it("submits once and accepts empty drafts", () => {
    const { record } = fixture();
    transition(record, action(record, "start"), now);
    transition(record, action(record, "advance", ""), now);
    transition(record, action(record, "advance"), now);
    const submit = action(record, "submit");
    transition(record, submit, now);
    transition(record, submit, now + 2000);
    expect(record.revision).toBe(4);
    expect(record.status).toBe("submitted");
    expect(() => transition(record, action(record, "save"), now)).toThrow();
  });
  it("expires without opening future stages and refuses late answers", () => {
    const { record } = fixture();
    transition(record, action(record, "start"), now);
    transition(record, action(record, "save", "accepted"), now);
    expire(record, now + record.assessment.duration * 60000);
    expect(record.status).toBe("expired");
    expect(record.completedAt).toBe(record.expiresAt);
    expect(view(record, now).unlockedStages).toHaveLength(1);
    expect(() =>
      transition(record, action(record, "save", "late"), now),
    ).toThrow();
    expect(record.answers[0].answer).toBe("accepted");
  });
  it("authenticates before retries and enforces token lifetime and revocation", () => {
    const { record } = fixture();
    record.sessionHashes = [{ hash: hash("token"), expiresAt: now + 1 }];
    expect(() => authorize(record, "wrong", now)).toThrow();
    authorize(record, "token", now);
    expect(() => authorize(record, "token", now + 1)).toThrow();
    record.status = "revoked";
    expect(() => authorize(record, "token", now)).toThrow();
  });
  it("rejects excessive answers and additional fields", () => {
    const { record } = fixture();
    transition(record, action(record, "start"), now);
    expect(() => action(record, "save", "a".repeat(20001))).toThrow();
    expect(() =>
      mutationSchema.parse({ ...action(record, "save"), expiresAt: "new" }),
    ).toThrow();
  });
});
describe("persistence", () => {
  it("does not overwrite malformed persisted state", async () => {
    const dir = await mkdtemp(join(tmpdir(), "candidate-"));
    dirs.push(dir);
    const path = join(dir, "data.json");
    await writeFile(path, "[]");
    await expect(
      new LocalCandidateStore(path).create(fixture().record),
    ).rejects.toMatchObject({ status: 503 });
    expect(await readFile(path, "utf8")).toBe("[]");
  });
  it("Supabase lookup filters both verified owner and request id", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null });
    const chain = { select: vi.fn(), eq: vi.fn(), maybeSingle };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    const from = vi.fn().mockReturnValue(chain);
    const store = new SupabaseCandidateStore({
      from,
    } as unknown as SupabaseClient);
    await store.lookup("verified-owner", "request-id");
    expect(chain.eq.mock.calls).toEqual([
      ["owner_id", "verified-owner"],
      ["request_id", "request-id"],
    ]);
  });
  it("shared limiter refuses attempts above the database budget and fails closed", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: false })
      .mockResolvedValueOnce({ error: { code: "offline" } });
    const store = new SupabaseCandidateStore({
      rpc,
    } as unknown as SupabaseClient);
    await expect(store.limit("bucket")).rejects.toMatchObject({ status: 429 });
    await expect(store.limit("bucket")).rejects.toMatchObject({ status: 503 });
  });
  it("serializes concurrent saves, persists expiry even on rejected write, and survives reopening", async () => {
    const dir = await mkdtemp(join(tmpdir(), "candidate-"));
    dirs.push(dir);
    let clock = now;
    const path = join(dir, "sessions.json"),
      store = new LocalCandidateStore(path, () => clock);
    const { record } = fixture();
    await store.create(record);
    await store.change(record.id, (r) =>
      transition(r, action(r, "start"), clock),
    );
    const started = await store.change(record.id, (r) => structuredClone(r));
    const a = action(started, "save", "first"),
      b = action(started, "save", "second");
    const results = await Promise.allSettled([
      store.change(record.id, (r) => transition(r, a, clock)),
      store.change(record.id, (r) => transition(r, b, clock)),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    clock += 121 * 60000;
    await expect(
      store.change(record.id, (r) =>
        transition(r, action(r, "save", "late"), clock),
      ),
    ).rejects.toThrow();
    const reopened = new LocalCandidateStore(path, () => clock);
    expect(await reopened.change(record.id, (r) => r.status)).toBe("expired");
    expect(
      JSON.parse(await readFile(path, "utf8"))[record.id].answers[0].answer,
    ).toBe("first");
  });
  it("deduplicates creation without recovering plaintext", async () => {
    const dir = await mkdtemp(join(tmpdir(), "candidate-"));
    dirs.push(dir);
    const store = new LocalCandidateStore(join(dir, "data.json"));
    const { record, token } = fixture();
    await store.create(record);
    const repeated = await store.create({ ...record, id: randomUUID() });
    expect(repeated.created).toBe(false);
    expect(repeated.record.id).toBe(record.id);
    expect(JSON.stringify(repeated)).not.toContain(token);
  });
  it("Supabase retries CAS with fresh state and database clock", async () => {
    const { record } = fixture();
    const rpc = vi.fn();
    rpc
      .mockResolvedValueOnce({
        data: {
          data: record,
          version: 3,
          serverNow: new Date(now).toISOString(),
        },
      })
      .mockResolvedValueOnce({ data: false })
      .mockResolvedValueOnce({
        data: {
          data: record,
          version: 4,
          serverNow: new Date(now + 1000).toISOString(),
        },
      })
      .mockResolvedValueOnce({ data: true });
    const store = new SupabaseCandidateStore({
      rpc,
    } as unknown as SupabaseClient);
    const value = await store.change(record.id, (r, time) => {
      transition(r, action(r, "start"), time);
      return r.startedAt;
    });
    expect(value).toBe(new Date(now + 1000).toISOString());
    expect(rpc.mock.calls[3][1].expected).toBe(4);
  });
  it("Supabase does not persist unauthorized callback changes", async () => {
    const { record } = fixture();
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          data: record,
          version: 0,
          serverNow: new Date(now).toISOString(),
        },
      })
      .mockResolvedValueOnce({ data: true });
    const store = new SupabaseCandidateStore({
      rpc,
    } as unknown as SupabaseClient);
    await expect(
      store.change(record.id, (r) => {
        r.owner = "attacker";
        throw new Error("Forbidden");
      }),
    ).rejects.toThrow("Forbidden");
    expect(rpc.mock.calls[1][1].payload.owner).toBe("owner");
  });
  it("fails closed with incomplete Supabase configuration and external local host", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(() => storeFor(new NextRequest("http://localhost"))).toThrow();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(() =>
      storeFor(new NextRequest("https://external.example")),
    ).toThrow();
  });
});
