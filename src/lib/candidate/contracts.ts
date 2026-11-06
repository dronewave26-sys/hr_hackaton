import { z } from "zod";
import { workspaceSchema } from "@/lib/domain";

export const MAX_ANSWER = 20000;
export const stageSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const base = {
  invitationId: z.uuid(),
  requestId: z.uuid(),
  revision: z.number().int().nonnegative(),
};
const answer = { stage: stageSchema, answer: z.string().max(MAX_ANSWER) };
export const mutationSchema = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("start") }).strict(),
  z.object({ ...base, ...answer, type: z.literal("save") }).strict(),
  z.object({ ...base, ...answer, type: z.literal("advance") }).strict(),
  z.object({ ...base, ...answer, type: z.literal("submit") }).strict(),
]);
export const invitationSchema = z
  .object({
    vacancyId: z.uuid(),
    candidateId: z.uuid(),
    workspaceRevision: z.number().int().nonnegative(),
    requestId: z.uuid(),
  })
  .strict();
export const exchangeSchema = z
  .object({
    invitationId: z.uuid(),
    secret: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export const sessionQuerySchema = z.object({ invitationId: z.uuid() });
export const errorSchema = z.object({ error: z.string(), code: z.string() });
export const sessionViewSchema = z.object({
  invitationId: z.uuid(),
  sessionId: z.uuid(),
  vacancyTitle: z.string(),
  status: z.enum(["ready", "active", "submitted", "expired", "revoked"]),
  durationMinutes: z.number(),
  serverNow: z.iso.datetime(),
  startedAt: z.iso.datetime().nullable(),
  expiresAt: z.iso.datetime().nullable(),
  completedAt: z.iso.datetime().nullable(),
  revision: z.number().int(),
  currentStage: stageSchema.nullable(),
  materials: z.string().nullable(),
  unlockedStages: z.array(
    z.object({
      stage: stageSchema,
      prompt: z.string(),
      acceptedAnswer: z.string(),
      savedAt: z.iso.datetime().nullable(),
      locked: z.boolean(),
    }),
  ),
});
export const sessionResponseSchema = z.object({ session: sessionViewSchema });
export const revokeSchema = z.object({}).strict();
export const invitationDetailSchema = z.object({
  invitation: sessionViewSchema.extend({
    snapshotId: z.uuid(),
    vacancyId: z.uuid(),
    candidateId: z.uuid(),
    invitationExpiresAt: z.iso.datetime(),
    assessment:
      workspaceSchema.shape.vacancies.element.shape.assessment.unwrap(),
  }),
});
export const invitationResponseSchema = z.object({
  invitationId: z.uuid(),
  invitationExpiresAt: z.iso.datetime(),
  url: z.string().nullable(),
  replayed: z.boolean(),
});
export type CandidateSessionView = z.infer<typeof sessionViewSchema>;
export type Mutation = z.infer<typeof mutationSchema>;
export type InvitationInput = z.infer<typeof invitationSchema>;
