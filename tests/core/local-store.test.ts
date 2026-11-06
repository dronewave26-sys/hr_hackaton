import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalStore } from "../../src/lib/local-store";
import { createFixtures } from "../../src/lib/fixtures";

let directory: string;
let file: string;
beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), "skillproof-test-")); file = join(directory, "workspace.json"); });
afterEach(async () => {
  if (!directory.startsWith(join(tmpdir(), "skillproof-test-"))) throw new Error("Unexpected cleanup path");
  await rm(directory, { recursive: true, force: true });
});

describe("local demo persistence", () => {
  it("persists across store instances and isolates owners", async () => {
    const first = new LocalStore(file);
    await first.change("owner-a", (workspace) => ({ ...workspace, vacancies: createFixtures() }));
    expect((await new LocalStore(file).get("owner-a")).vacancies).toHaveLength(2);
    expect((await first.get("owner-b")).vacancies).toHaveLength(0);
  });
  it("serializes concurrent writes from separate store instances without losing changes", async () => {
    await Promise.all(Array.from({ length: 8 }, (_, index) => new LocalStore(file).change("owner-a", (workspace) => {
      const job = createFixtures()[0];
      job.title = `Demo ${index}`;
      workspace.vacancies.push(job);
      return workspace;
    })));
    const workspace = await new LocalStore(file).get("owner-a");
    expect(workspace.revision).toBe(8);
    expect(new Set(workspace.vacancies.map((job) => job.title)).size).toBe(8);
  });
  it("does not overwrite data when a transaction fails", async () => {
    const store = new LocalStore(file);
    await store.change("owner-a", (workspace) => ({ ...workspace, vacancies: createFixtures() }));
    const before = await readFile(file, "utf8");
    await expect(store.change("owner-a", () => { throw new Error("Conflict"); })).rejects.toThrow("Conflict");
    expect(await readFile(file, "utf8")).toBe(before);
    await store.change("owner-b", (workspace) => workspace);
    expect((await store.get("owner-a")).vacancies).toHaveLength(2);
  });
  it("rejects malformed stored JSON rather than resetting it", async () => {
    await writeFile(file, '{"owner-a": {"revision": 1, "vacancies": "invalid"}}');
    const before = await readFile(file, "utf8");
    await expect(new LocalStore(file).change("owner-a", (workspace) => workspace)).rejects.toThrow();
    expect(await readFile(file, "utf8")).toBe(before);
  });
});
