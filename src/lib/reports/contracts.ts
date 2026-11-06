import { z } from "zod";
import { stageSchema, sessionViewSchema } from "@/lib/candidate/contracts";

const nonempty = z.string().trim().min(1);
export const practicalReportContentSchema = z
  .object({
    summary: nonempty.max(4000),
    criteria: z
      .array(
        z
          .object({
            criterion: nonempty.max(500),
            level: z.enum(["demonstrated", "partial", "not_demonstrated"]),
            evidence: z
              .array(
                z
                  .object({
                    stage: stageSchema,
                    quote: z.string().min(1).max(2000),
                  })
                  .strict(),
              )
              .max(12),
            reason: nonempty.max(3000),
            question: nonempty.max(600),
          })
          .strict(),
      )
      .min(1)
      .max(15),
    limitations: z.array(nonempty.max(1000)).max(12),
  })
  .strict();

export const practicalReportSchema = practicalReportContentSchema
  .extend({
    source: z.literal("claude"),
    model: nonempty.max(200),
    createdAt: z.iso.datetime(),
  })
  .strict();
export const practicalReportResponseSchema = z.object({
  report: practicalReportSchema.nullable(),
  aiReady: z.boolean(),
});
export const invitationListResponseSchema = z.object({
  invitations: z.array(
    z.object({
      invitationId: z.uuid(),
      status: sessionViewSchema.shape.status,
      completedAt: z.iso.datetime().nullable(),
      revision: z.number().int().nonnegative(),
    }),
  ),
});
export type PracticalReport = z.infer<typeof practicalReportSchema>;
export type PracticalReportContent = z.infer<
  typeof practicalReportContentSchema
>;
export type InvitationList = z.infer<
  typeof invitationListResponseSchema
>["invitations"];
