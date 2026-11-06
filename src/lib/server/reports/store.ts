import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecordData } from "../candidate/model";
import { AppError } from "../errors";
import {
  reportEnvelopeSchema,
  terminalSnapshot,
  type ReportEnvelope,
} from "./model";
import { reportAdminClient } from "./access";

export interface PracticalReportStore {
  get(owner: string, id: string): Promise<ReportEnvelope | null>;
  put(envelope: ReportEnvelope, record: RecordData): Promise<ReportEnvelope>;
}
const globals = globalThis as typeof globalThis & {
  skillproofReportLocks?: Map<string, Promise<unknown>>;
};
const locks = (globals.skillproofReportLocks ??= new Map());

export class LocalPracticalReportStore implements PracticalReportStore {
  constructor(
    private path = join(process.cwd(), ".data/practical-reports.json"),
  ) {}
  private async rows() {
    try {
      return z
        .record(z.uuid(), reportEnvelopeSchema)
        .parse(JSON.parse(await readFile(this.path, "utf8")));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
      throw new AppError("Saxlanmış praktik hesabat oxunmadı.", 503);
    }
  }
  async get(owner: string, id: string) {
    await (locks.get(this.path) ?? Promise.resolve()).catch(() => {});
    const row = (await this.rows())[id];
    return row?.owner === owner ? row : null;
  }
  async put(envelope: ReportEnvelope) {
    const operation = (locks.get(this.path) ?? Promise.resolve())
      .catch(() => {})
      .then(async () => {
        const rows = await this.rows();
        const prior = rows[envelope.invitationId];
        if (prior) {
          if (
            prior.owner !== envelope.owner ||
            prior.binding !== envelope.binding
          )
            throw new AppError("Hesabat başqa yekun cavaba bağlıdır.", 409);
          return prior;
        }
        rows[envelope.invitationId] = reportEnvelopeSchema.parse(envelope);
        await mkdir(dirname(this.path), { recursive: true });
        const temporary = `${this.path}.${randomUUID()}.tmp`;
        await writeFile(temporary, JSON.stringify(rows), {
          encoding: "utf8",
          mode: 0o600,
        });
        await rename(temporary, this.path);
        return envelope;
      });
    locks.set(this.path, operation);
    try {
      return await operation;
    } finally {
      if (locks.get(this.path) === operation) locks.delete(this.path);
    }
  }
}

function fromRow(row: {
  invitation_id: string;
  owner_id: string;
  snapshot_id: string;
  session_id: string;
  binding: string;
  report: unknown;
}): ReportEnvelope {
  const parsed = reportEnvelopeSchema.safeParse({
    invitationId: row.invitation_id,
    owner: row.owner_id,
    snapshotId: row.snapshot_id,
    sessionId: row.session_id,
    binding: row.binding,
    report: row.report,
  });
  if (!parsed.success)
    throw new AppError("Saxlanmış praktik hesabatın formatı yanlışdır.", 503);
  return parsed.data;
}
export class SupabasePracticalReportStore implements PracticalReportStore {
  constructor(private client: SupabaseClient) {}
  async get(owner: string, id: string) {
    const { data, error } = await this.client
      .from("skillproof_practical_reports")
      .select("invitation_id,owner_id,snapshot_id,session_id,binding,report")
      .eq("owner_id", owner)
      .eq("invitation_id", id)
      .maybeSingle();
    if (error)
      throw new AppError(
        "Praktik hesabat oxunmadı. 003 miqrasiyasını və server bağlantısını yoxlayın.",
        503,
      );
    return data ? fromRow(data) : null;
  }
  async put(envelope: ReportEnvelope, record: RecordData) {
    const { data, error } = await this.client.rpc(
      "skillproof_practical_report_create",
      {
        payload: {
          invitation_id: envelope.invitationId,
          owner_id: envelope.owner,
          snapshot_id: envelope.snapshotId,
          session_id: envelope.sessionId,
          binding: envelope.binding,
          report: envelope.report,
        },
        expected_snapshot: terminalSnapshot(record),
      },
    );
    if (error)
      throw new AppError(
        error.code === "40001"
          ? "Sınağın yekun vəziyyəti dəyişib. Yeniləyib təkrar cəhd edin."
          : "Praktik hesabat saxlanmadı.",
        error.code === "40001" ? 409 : 503,
      );
    if (!data) throw new AppError("Praktik hesabat saxlanmadı.", 503);
    return fromRow(data);
  }
}

export function practicalReportStore(
  storage: "local" | "supabase",
): PracticalReportStore {
  return storage === "supabase"
    ? new SupabasePracticalReportStore(reportAdminClient())
    : new LocalPracticalReportStore();
}
