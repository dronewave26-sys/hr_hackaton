import "server-only";
import { z } from "zod";
import { practicalReportContentSchema, practicalReportSchema, type PracticalReportContent } from "@/lib/reports/contracts";
import { hash, type RecordData } from "../candidate/model";
import { AppError } from "../errors";

export const reportEnvelopeSchema = z.object({
  invitationId: z.uuid(), owner: z.string().min(1), snapshotId: z.uuid(), sessionId: z.uuid(),
  binding: z.string().regex(/^[a-f0-9]{64}$/), report: practicalReportSchema,
});
export type ReportEnvelope = z.infer<typeof reportEnvelopeSchema>;

export function terminalSnapshot(record: RecordData) {
  if (!["submitted", "expired"].includes(record.status) || !record.completedAt) {
    throw new AppError("Praktik hesabat yalnız yekunlaşdırılmış sınaq üçün hazırlanır.", 409);
  }
  return {
    snapshotId: record.snapshotId, sessionId: record.sessionId, assessment: record.assessment,
    answers: record.answers, status: record.status, completedAt: record.completedAt,
  };
}
export const reportBinding = (record: RecordData) => hash(JSON.stringify(terminalSnapshot(record)));

export function validateReportContent(value: unknown, record: RecordData): PracticalReportContent {
  terminalSnapshot(record);
  const content = practicalReportContentSchema.parse(value);
  const expected = record.assessment.criteria;
  if (content.criteria.length !== expected.length || new Set(content.criteria.map((criterion) => criterion.criterion)).size !== expected.length) {
    throw new AppError("AI hesabatında bütün meyarlar ayrıca göstərilməyib.", 502);
  }
  for (const item of content.criteria) {
    if (!expected.includes(item.criterion)) throw new AppError("AI hesabatında təsdiqlənməmiş meyar var.", 502);
    if (item.level !== "not_demonstrated" && item.evidence.length === 0) throw new AppError("Müsbət müşahidə üçün cavabdan sübut tələb olunur.", 502);
    for (const proof of item.evidence) {
      const answer = record.answers[proof.stage - 1];
      if (!proof.quote.trim() || !answer.savedAt || !answer.answer.includes(proof.quote)) {
        throw new AppError("AI hesabatının sitatı qəbul edilmiş mərhələ cavabında tapılmadı.", 502);
      }
    }
  }
  // Stable display order follows the HR-approved assessment, not model ordering.
  return { ...content, criteria: expected.map((criterion) => content.criteria.find((item) => item.criterion === criterion)!) };
}

export function verifyCached(envelope: ReportEnvelope, record: RecordData) {
  if (envelope.invitationId !== record.id || envelope.owner !== record.owner || envelope.snapshotId !== record.snapshotId || envelope.sessionId !== record.sessionId || envelope.binding !== reportBinding(record)) {
    throw new AppError("Hesabat bu sınağın yekun cavablarına uyğun gəlmir.", 409);
  }
  validateReportContent({ summary: envelope.report.summary, criteria: envelope.report.criteria, limitations: envelope.report.limitations }, record);
  return envelope.report;
}
