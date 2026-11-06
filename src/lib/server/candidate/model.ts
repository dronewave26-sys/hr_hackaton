import "server-only";
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import type { Assessment, Workspace } from "@/lib/domain";
import { z } from "zod";
import { workspaceSchema } from "@/lib/domain";
import {
  invitationSchema,
  sessionViewSchema,
  MAX_ANSWER,
} from "@/lib/candidate/contracts";
import type {
  CandidateSessionView,
  InvitationInput,
  Mutation,
} from "@/lib/candidate/contracts";
import { AppError } from "../errors";

export class CandidateError extends AppError {
  constructor(
    message: string,
    status: number,
    public code: string,
  ) {
    super(message, status);
  }
}
export function fail(message: string, status = 409, code = "CONFLICT"): never {
  throw new CandidateError(message, status, code);
}
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const secret = () => randomBytes(32).toString("hex");
export function matches(value: string, digest: string) {
  return (
    /^[a-f0-9]{64}$/.test(digest) &&
    timingSafeEqual(Buffer.from(hash(value), "hex"), Buffer.from(digest, "hex"))
  );
}
export type RecordData = {
  id: string;
  owner: string;
  createRequest: InvitationInput;
  createHash: string;
  snapshotId: string;
  vacancyTitle: string;
  assessment: Assessment;
  secretHash: string;
  invitationExpiresAt: string;
  sessionId: string;
  sessionHashes: { hash: string; expiresAt: number }[];
  status: CandidateSessionView["status"];
  startedAt: string | null;
  expiresAt: string | null;
  completedAt: string | null;
  revision: number;
  currentStage: 1 | 2 | 3 | null;
  answers: { answer: string; savedAt: string | null }[];
  requests: Record<string, string>;
};
export const recordSchema: z.ZodType<RecordData> = z.object({
  id: z.uuid(),
  owner: z.string().min(1),
  createRequest: invitationSchema,
  createHash: z.string().regex(/^[a-f0-9]{64}$/),
  snapshotId: z.uuid(),
  vacancyTitle: z.string(),
  assessment: workspaceSchema.shape.vacancies.element.shape.assessment.unwrap(),
  secretHash: z.string().regex(/^[a-f0-9]{64}$/),
  invitationExpiresAt: z.iso.datetime(),
  sessionId: z.uuid(),
  sessionHashes: z
    .array(
      z.object({
        hash: z.string().regex(/^[a-f0-9]{64}$/),
        expiresAt: z.number(),
      }),
    )
    .max(8),
  status: sessionViewSchema.shape.status,
  startedAt: z.iso.datetime().nullable(),
  expiresAt: z.iso.datetime().nullable(),
  completedAt: z.iso.datetime().nullable(),
  revision: z.number().int().nonnegative(),
  currentStage: sessionViewSchema.shape.currentStage,
  answers: z
    .array(
      z.object({
        answer: z.string().max(MAX_ANSWER),
        savedAt: z.iso.datetime().nullable(),
      }),
    )
    .length(3),
  requests: z.record(z.uuid(), z.string().regex(/^[a-f0-9]{64}$/)),
});
export function createRecord(
  owner: string,
  input: InvitationInput,
  workspace: Workspace,
  now: number,
) {
  if (workspace.revision !== input.workspaceRevision)
    fail("İş sahəsi dəyişib. HR panelini yeniləyin.");
  const vacancy = workspace.vacancies.find((v) => v.id === input.vacancyId);
  if (!vacancy?.candidates.some((c) => c.id === input.candidateId))
    fail("Vakansiya və ya namizəd tapılmadı.", 404, "NOT_FOUND");
  if (!vacancy.assessment?.approvedAt)
    fail("Sınaq əvvəlcə HR tərəfindən təsdiqlənməlidir.", 409, "NOT_APPROVED");
  const token = secret();
  const record: RecordData = {
    id: randomUUID(),
    owner,
    createRequest: input,
    createHash: hash(JSON.stringify(input)),
    snapshotId: randomUUID(),
    vacancyTitle: vacancy.title,
    assessment: structuredClone(vacancy.assessment),
    secretHash: hash(token),
    invitationExpiresAt: new Date(now + 7 * 86400000).toISOString(),
    sessionId: randomUUID(),
    sessionHashes: [],
    status: "ready",
    startedAt: null,
    expiresAt: null,
    completedAt: null,
    revision: 0,
    currentStage: null,
    answers: [1, 2, 3].map(() => ({ answer: "", savedAt: null })),
    requests: {},
  };
  return { record, token };
}
export function expire(record: RecordData, now: number) {
  if (record.status === "active" && Date.parse(record.expiresAt!) <= now) {
    record.status = "expired";
    record.completedAt = record.expiresAt;
    record.revision++;
  }
}
export function authorize(record: RecordData, token: string, now = Date.now()) {
  if (
    !record.sessionHashes.some(
      (item) => item.expiresAt > now && matches(token, item.hash),
    )
  )
    fail(
      "Sessiya uyğun gəlmir. Öz dəvət keçidinizi açın.",
      401,
      "SESSION_MISMATCH",
    );
  if (record.status === "revoked") fail("Dəvət ləğv edilib.", 410, "REVOKED");
}
export function transition(record: RecordData, action: Mutation, now: number) {
  const fingerprint = hash(JSON.stringify(action));
  if (record.requests[action.requestId]) {
    if (record.requests[action.requestId] !== fingerprint)
      fail(
        "Eyni sorğu identifikatoru fərqli məlumatla istifadə edilib.",
        409,
        "REQUEST_REUSED",
      );
    return;
  }
  if (record.status === "expired")
    fail(
      "Vaxt bitib. Son qəbul edilmiş cavablar yekunlaşdırılıb.",
      410,
      "EXPIRED",
    );
  if (action.type === "start" && record.status !== "ready") return;
  if (record.revision !== action.revision)
    fail(
      "Başqa sorğu cavabı dəyişib. Qaralamanız saxlanılıb; server cavabı ilə müqayisə edin.",
      409,
      "REVISION_CONFLICT",
    );
  if (action.type === "start") {
    if (Date.parse(record.invitationExpiresAt) <= now)
      fail("Dəvətin vaxtı bitib.", 410, "INVITATION_EXPIRED");
    record.status = "active";
    record.currentStage = 1;
    record.startedAt = new Date(now).toISOString();
    record.expiresAt = new Date(
      now + record.assessment.duration * 60000,
    ).toISOString();
  } else {
    if (record.status !== "active" || action.stage !== record.currentStage)
      fail("Bu mərhələ dəyişdirilə bilməz.", 409, "STAGE_LOCKED");
    if (
      (action.type === "advance" && action.stage === 3) ||
      (action.type === "submit" && action.stage !== 3)
    )
      fail("Mərhələ ardıcıllığı yanlışdır.");
    record.answers[action.stage - 1] = {
      answer: action.answer,
      savedAt: new Date(now).toISOString(),
    };
    if (action.type === "advance")
      record.currentStage = (action.stage + 1) as 2 | 3;
    if (action.type === "submit") {
      record.status = "submitted";
      record.completedAt = new Date(now).toISOString();
    }
  }
  record.revision++;
  record.requests[action.requestId] = fingerprint;
}
export function view(record: RecordData, now: number): CandidateSessionView {
  return {
    invitationId: record.id,
    sessionId: record.sessionId,
    vacancyTitle: record.vacancyTitle,
    status: record.status,
    durationMinutes: record.assessment.duration,
    serverNow: new Date(now).toISOString(),
    startedAt: record.startedAt,
    expiresAt: record.expiresAt,
    completedAt: record.completedAt,
    revision: record.revision,
    currentStage: record.currentStage,
    materials: record.startedAt ? record.assessment.materials : null,
    unlockedStages: record.assessment.stages
      .slice(0, record.currentStage ?? 0)
      .map((prompt, i) => ({
        stage: (i + 1) as 1 | 2 | 3,
        prompt,
        acceptedAnswer: record.answers[i].answer,
        savedAt: record.answers[i].savedAt,
        locked: record.status !== "active" || i + 1 !== record.currentStage,
      })),
  };
}
export function hrView(record: RecordData, now: number) {
  return {
    snapshotId: record.snapshotId,
    vacancyId: record.createRequest.vacancyId,
    candidateId: record.createRequest.candidateId,
    assessment: record.assessment,
    invitationExpiresAt: record.invitationExpiresAt,
    ...view(record, now),
  };
}
