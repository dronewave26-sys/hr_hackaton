import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { expire, fail, recordSchema, type RecordData } from "./model";
import { z } from "zod";

export interface CandidateStore {
  lookup(owner: string, requestId: string): Promise<RecordData | null>;
  create(record: RecordData): Promise<{ record: RecordData; created: boolean }>;
  change<T>(
    id: string,
    action: (record: RecordData, now: number) => T,
  ): Promise<T>;
  limit(key: string): Promise<void>;
}
type CandidateGlobals = typeof globalThis & {
  skillproofCandidateLocks?: Map<string, Promise<unknown>>;
};
const queues = ((globalThis as CandidateGlobals).skillproofCandidateLocks ??=
  new Map<string, Promise<unknown>>());
export class LocalCandidateStore implements CandidateStore {
  constructor(
    private path = join(process.cwd(), ".data/candidate-sessions.json"),
    private clock = Date.now,
  ) {}
  private async transaction<T>(
    action: (rows: Record<string, RecordData>) => T,
  ) {
    const previous = queues.get(this.path) ?? Promise.resolve();
    const run = previous
      .catch(() => {})
      .then(async () => {
        let rows: Record<string, RecordData> = {};
        try {
          rows = z
            .record(z.uuid(), recordSchema)
            .parse(JSON.parse(await readFile(this.path, "utf8")));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT")
            fail("Saxlanmış məlumat oxunmadı.", 503, "STORAGE");
        }
        let result: T | undefined;
        let failure: unknown;
        try {
          result = action(rows);
        } catch (error) {
          failure = error;
        }
        await mkdir(dirname(this.path), { recursive: true });
        const temp = `${this.path}.${randomUUID()}.tmp`;
        await writeFile(temp, JSON.stringify(rows), {
          encoding: "utf8",
          mode: 0o600,
        });
        await rename(temp, this.path);
        if (failure) throw failure;
        return result as T;
      });
    queues.set(this.path, run);
    try {
      return await run;
    } finally {
      if (queues.get(this.path) === run) queues.delete(this.path);
    }
  }
  create(record: RecordData) {
    return this.transaction((rows) => {
      const prior = Object.values(rows).find(
        (r) =>
          r.owner === record.owner &&
          r.createRequest.requestId === record.createRequest.requestId,
      );
      if (prior) {
        if (prior.createHash !== record.createHash)
          fail("Sorğu identifikatoru artıq istifadə edilib.");
        return { record: prior, created: false };
      }
      rows[record.id] = record;
      return { record, created: true };
    });
  }
  lookup(owner: string, requestId: string) {
    return this.transaction(
      (rows) =>
        Object.values(rows).find(
          (row) =>
            row.owner === owner && row.createRequest.requestId === requestId,
        ) ?? null,
    );
  }
  change<T>(id: string, action: (record: RecordData, now: number) => T) {
    return this.transaction((rows) => {
      const record = rows[id];
      if (!record) fail("Dəvət tapılmadı.", 404, "NOT_FOUND");
      const now = this.clock();
      expire(record, now);
      // Failed mutations preserve only time-based expiry, never partial writes.
      const next = structuredClone(record);
      const result = action(next, now);
      rows[id] = next;
      return result;
    });
  }
  async limit(key: string) {
    localLimit(key);
  }
}
const buckets = new Map<string, { count: number; until: number }>();
function localLimit(key: string) {
  const now = Date.now();
  for (const [k, b] of buckets) if (b.until <= now) buckets.delete(k);
  const bucket = buckets.get(key) ?? { count: 0, until: now + 60000 };
  if (buckets.size >= 10000 && !buckets.has(key))
    fail("Sorğu həddi aşılıb.", 429, "RATE_LIMIT");
  bucket.count++;
  buckets.set(key, bucket);
  if (bucket.count > 20)
    fail(
      "Çox cəhd edildi. Bir dəqiqə sonra yenidən yoxlayın.",
      429,
      "RATE_LIMIT",
    );
}
export class SupabaseCandidateStore implements CandidateStore {
  constructor(private client: SupabaseClient) {}
  async lookup(owner: string, requestId: string) {
    const { data, error } = await this.client
      .from("skillproof_candidate_sessions")
      .select("data")
      .eq("owner_id", owner)
      .eq("request_id", requestId)
      .maybeSingle();
    if (error) fail("Dəvət oxunmadı.", 503, "STORAGE");
    return (data?.data as RecordData | undefined) ?? null;
  }
  async create(record: RecordData) {
    const { data, error } = await this.client.rpc(
      "skillproof_candidate_create",
      { payload: record },
    );
    if (error)
      fail(
        "Dəvət saxlanmadı. Təsdiqi və iş sahəsinin versiyasını yoxlayın.",
        error.code === "40001" ? 409 : 503,
        "STORAGE",
      );
    return data as { record: RecordData; created: boolean };
  }
  async change<T>(
    id: string,
    action: (record: RecordData, now: number) => T,
  ): Promise<T> {
    for (let attempt = 0; attempt < 12; attempt++) {
      const { data, error } = await this.client.rpc(
        "skillproof_candidate_read",
        { target: id },
      );
      if (error) fail("Sessiya oxunmadı.", 503, "STORAGE");
      if (!data) fail("Dəvət tapılmadı.", 404, "NOT_FOUND");
      const row = data as {
        data: RecordData;
        version: number;
        serverNow: string;
      };
      const next = structuredClone(row.data);
      const now = Date.parse(row.serverNow);
      expire(next, now);
      let result: T | undefined;
      let failure: unknown;
      const expired = structuredClone(next);
      try {
        result = action(next, now);
      } catch (error) {
        failure = error;
      }
      const value = failure ? expired : next;
      const { data: saved, error: writeError } = await this.client.rpc(
        "skillproof_candidate_cas",
        { target: id, expected: row.version, payload: value },
      );
      if (writeError) fail("Sessiya saxlanmadı.", 503, "STORAGE");
      if (!saved) continue;
      if (failure) throw failure;
      return result as T;
    }
    fail(
      "Paralel sorğu baş verir. Təkrar cəhd edin.",
      409,
      "REVISION_CONFLICT",
    );
  }
  async limit(key: string) {
    const { data, error } = await this.client.rpc(
      "skillproof_candidate_limit",
      { bucket_key: key },
    );
    if (error) fail("Sorğu qoruması əlçatan deyil.", 503, "STORAGE");
    if (!data) fail("Çox cəhd edildi. Bir dəqiqə gözləyin.", 429, "RATE_LIMIT");
  }
}
export function storeFor(request: NextRequest): CandidateStore {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url || key) {
    if (!url || !key || !process.env.SUPABASE_SECRET_KEY)
      fail(
        "Namizəd modulu üçün Supabase server konfiqurasiyası tamamlanmayıb.",
        503,
        "CONFIG",
      );
    return new SupabaseCandidateStore(
      createClient(url, process.env.SUPABASE_SECRET_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    );
  }
  const host = request.headers.get("host") ?? request.nextUrl.host;
  if (
    !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host) ||
    !(
      process.env.LOCAL_DEMO_MODE === "true" ||
      (process.env.NODE_ENV !== "production" &&
        process.env.LOCAL_DEMO_MODE !== "false")
    )
  )
    fail("Lokal demo yalnız localhost üçün açıqdır.", 503, "CONFIG");
  return new LocalCandidateStore();
}
