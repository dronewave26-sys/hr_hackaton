import "server-only";
import { cookies } from "next/headers";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { NextRequest } from "next/server";
import { context, supabaseServer } from "../context";
import { AppError } from "../errors";
import { hash, recordSchema, type RecordData } from "../candidate/model";
import { storeFor } from "../candidate/store";
import type { InvitationList } from "@/lib/reports/contracts";

export async function reportOwner(request: NextRequest) {
  const ctx = await context(request);
  if (ctx.config.storage === "supabase") {
    const { data, error } = await (await supabaseServer()).auth.getUser();
    if (error || !data.user) throw new AppError("HR girişi tələb olunur.", 401);
    return { owner: data.user.id, storage: "supabase" as const };
  }
  const token = (await cookies()).get("sp_demo_owner")?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new AppError("Əvvəl HR iş sahəsini açın.", 401);
  return { owner: hash(token), storage: "local" as const };
}

export function reportAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new AppError("Praktik hesabat üçün Supabase server konfiqurasiyası tamamlanmayıb.", 503);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function ownedRecord(request: NextRequest, owner: string, id: string): Promise<RecordData> {
  return storeFor(request).change(id, (record) => {
    if (record.owner !== owner) throw new AppError("Dəvət tapılmadı.", 404);
    return recordSchema.parse(structuredClone(record));
  });
}

export async function ownedInvitationList(request: NextRequest, owner: string, storage: "local" | "supabase", vacancyId: string, candidateId: string): Promise<InvitationList> {
  let records: RecordData[];
  if (storage === "supabase") {
    const { data, error } = await reportAdminClient().from("skillproof_candidate_sessions").select("data")
      .eq("owner_id", owner).contains("data", { createRequest: { vacancyId, candidateId } })
      .order("data->>invitationExpiresAt", { ascending: false }).limit(200);
    if (error) throw new AppError("Dəvət siyahısı oxunmadı.", 503);
    const parsed = z.array(z.object({ data: recordSchema })).safeParse(data);
    if (!parsed.success) throw new AppError("Saxlanmış dəvət məlumatı yanlışdır.", 503);
    records = parsed.data.map((row) => row.data);
  } else {
    try {
      records = Object.values(z.record(z.uuid(), recordSchema).parse(JSON.parse(await readFile(join(process.cwd(), ".data/candidate-sessions.json"), "utf8"))));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") records = [];
      else throw new AppError("Dəvət siyahısı oxunmadı.", 503);
    }
  }
  const matching = records.filter((record) => record.owner === owner && record.createRequest.vacancyId === vacancyId && record.createRequest.candidateId === candidateId)
    .sort((a, b) => b.invitationExpiresAt.localeCompare(a.invitationExpiresAt)).slice(0, 200);
  const result: InvitationList = [];
  for (const record of matching) {
    // Only due active sessions require a transaction to persist database-time
    // expiry; terminal/read-only entries do not incur a CAS write per list item.
    const current = record.status === "active" && record.expiresAt && Date.parse(record.expiresAt) <= Date.now()
      ? await ownedRecord(request, owner, record.id) : record;
    result.push({ invitationId: current.id, status: current.status, completedAt: current.completedAt, revision: current.revision });
  }
  return result;
}
