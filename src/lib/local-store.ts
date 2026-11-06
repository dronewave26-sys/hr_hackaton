import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { emptyWorkspace, workspaceSchema, type Workspace } from "./domain";

type GlobalLocks = typeof globalThis & { skillproofLocks?: Map<string, Promise<unknown>> };
const locks = ((globalThis as GlobalLocks).skillproofLocks ??= new Map());

export class LocalStore {
  constructor(private file: string) {}
  private async all(): Promise<Record<string, Workspace>> {
    try { return z.record(z.string(), workspaceSchema).parse(JSON.parse(await readFile(this.file, "utf8"))); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return {}; throw error; }
  }
  async get(owner: string): Promise<Workspace> {
    await (locks.get(this.file) ?? Promise.resolve()).catch(() => {});
    return (await this.all())[owner] ?? emptyWorkspace();
  }
  async change(owner: string, transform: (value: Workspace) => Workspace): Promise<Workspace> {
    const previous = locks.get(this.file) ?? Promise.resolve();
    const operation = previous.catch(() => {}).then(async () => {
      const all = await this.all();
      const current = all[owner] ?? emptyWorkspace();
      const result = transform(structuredClone(current));
      result.revision = current.revision + 1;
      workspaceSchema.parse(result);
      all[owner] = result;
      await mkdir(dirname(this.file), { recursive: true });
      const temporary = `${this.file}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(all), { encoding: "utf8", mode: 0o600 });
      await rename(temporary, this.file);
      return result;
    });
    locks.set(this.file, operation);
    return operation;
  }
}
