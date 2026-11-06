import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
vi.mock("server-only", () => ({}));
import { LocalPracticalReportStore } from "../../src/lib/server/reports/store";
import type { ReportEnvelope } from "../../src/lib/server/reports/model";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});
async function setup() {
  const directory = await mkdtemp(join(tmpdir(), "skillproof-reports-"));
  directories.push(directory);
  const path = join(directory, "reports.json");
  const row: ReportEnvelope = {
    owner: "owner-a",
    invitationId: crypto.randomUUID(),
    snapshotId: crypto.randomUUID(),
    sessionId: crypto.randomUUID(),
    binding: "a".repeat(64),
    report: {
      source: "claude",
      model: "test",
      createdAt: new Date().toISOString(),
      summary: "İlkin hesabat",
      limitations: ["Canlı yoxlama"],
      criteria: [
        {
          criterion: "Təhlil",
          level: "not_demonstrated",
          evidence: [],
          reason: "Bu cavabda göstərilməyib.",
          question: "Həllini izah et.",
        },
      ],
    },
  };
  return { store: new LocalPracticalReportStore(path), row, path };
}
describe("immutable local report persistence", () => {
  it("persists and reloads only for the owning HR", async () => {
    const { store, row, path } = await setup();
    await store.put(row);
    expect(
      await new LocalPracticalReportStore(path).get(
        "owner-a",
        row.invitationId,
      ),
    ).toEqual(row);
    expect(await store.get("owner-b", row.invitationId)).toBeNull();
  });
  it("returns the original cached report on retries and concurrent creation", async () => {
    const { store, row } = await setup();
    const changed = structuredClone(row);
    changed.report.summary = "Changed";
    const results = await Promise.all([store.put(row), store.put(changed)]);
    expect(results.map((result) => result.report.summary)).toEqual([
      row.report.summary,
      row.report.summary,
    ]);
  });
  it("rejects rebinding an existing report", async () => {
    const { store, row } = await setup();
    await store.put(row);
    await expect(
      store.put({ ...row, binding: "b".repeat(64) }),
    ).rejects.toMatchObject({ status: 409 });
    await expect(store.put({ ...row, owner: "owner-b" })).rejects.toMatchObject(
      { status: 409 },
    );
  });
  it("does not silently replace corrupted storage", async () => {
    const { store, row, path } = await setup();
    await writeFile(path, "corrupt", "utf8");
    await expect(store.put(row)).rejects.toMatchObject({ status: 503 });
  });
});
