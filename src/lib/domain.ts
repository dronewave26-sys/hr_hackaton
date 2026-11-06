import { z } from "zod";

export const text = z.string().trim().min(1, "Bu sahəni doldurun.");
export const analysisSchema = z.object({
  items: z
    .array(
      z.object({
        skill: text.max(160),
        status: z.enum(["evidence", "missing", "verify"]),
        quote: z.string().max(1500),
        observation: text.max(2000),
        question: text.max(600),
      }),
    )
    .min(1)
    .max(15),
  summary: text.max(2500),
});
export type AnalysisContent = z.infer<typeof analysisSchema>;
export type Analysis = AnalysisContent & {
  source: "claude" | "saved-demo";
  createdAt: string;
  model?: string;
};
export type Candidate = {
  id: string;
  name: string;
  cv: string;
  demoKey?: string;
  createdAt: string;
  analysis?: Analysis;
};
export type Assessment = {
  stages: [string, string, string];
  materials: string;
  duration: number;
  criteria: string[];
  approvedAt?: string;
};
export type Vacancy = {
  id: string;
  title: string;
  department: string;
  description: string;
  skills: string[];
  createdAt: string;
  candidates: Candidate[];
  demoKey?: "sales" | "soc";
  assessment?: Assessment;
};
export type Workspace = { revision: number; vacancies: Vacancy[] };
export type AppConfig = {
  storage: "local" | "supabase";
  aiReady: boolean;
  model: string | null;
  account: string | null;
};
export const emptyWorkspace = (): Workspace => ({ revision: 0, vacancies: [] });

// Stored JSON must be checked just like an external API response.
const assessmentSchema = z.object({
  stages: z.tuple([text.max(12000), text.max(12000), text.max(12000)]),
  materials: text.max(16000),
  duration: z.number().int().min(5).max(120),
  criteria: z.array(text.max(500)).min(1).max(15),
  approvedAt: z.iso.datetime().optional(),
});
export const workspaceSchema = z.object({
  revision: z.number().int().nonnegative(),
  vacancies: z.array(
    z.object({
      id: z.uuid(),
      title: text.max(160),
      department: text.max(100),
      description: text.min(30).max(12000),
      skills: z.array(text.max(160)).min(1).max(15),
      createdAt: z.iso.datetime(),
      demoKey: z.enum(["sales", "soc"]).optional(),
      assessment: assessmentSchema.optional(),
      candidates: z.array(
        z.object({
          id: z.uuid(),
          name: text.max(120),
          cv: z.string().min(30).max(30000),
          demoKey: z.string().optional(),
          createdAt: z.iso.datetime(),
          analysis: analysisSchema
            .extend({
              source: z.enum(["claude", "saved-demo"]),
              createdAt: z.iso.datetime(),
              model: z.string().optional(),
            })
            .optional(),
        }),
      ),
    }),
  ),
});

export function validateAnalysis(
  value: unknown,
  skills: string[],
  cv: string,
): AnalysisContent {
  const result = analysisSchema.parse(value);
  if (
    result.items.length !== skills.length ||
    new Set(result.items.map((item) => item.skill)).size !== skills.length
  ) {
    throw new Error("AI bütün bacarıqları ayrıca qiymətləndirməyib.");
  }
  for (const item of result.items) {
    if (!skills.includes(item.skill))
      throw new Error("AI təsdiqlənməmiş bacarıq əlavə edib.");
    if (item.status === "missing" && item.quote !== "")
      throw new Error("Məlumat yoxdursa sitat boş olmalıdır.");
    if (item.status !== "missing" && !item.quote.trim())
      throw new Error("Müşahidə üçün mənbə tələb olunur.");
    if (item.quote && !cv.includes(item.quote))
      throw new Error("AI sitatı CV mətnində tapılmadı.");
  }
  return result;
}

const vacancyFields = {
  title: text.max(160),
  department: text.max(100),
  description: text
    .min(30, "İş təsvirini ən azı 30 simvolla yazın.")
    .max(12000),
  skills: z
    .array(text.max(160))
    .min(1)
    .max(15)
    .refine(
      (items) => new Set(items).size === items.length,
      "Bacarıqlar təkrarlanmamalıdır.",
    ),
};
export const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("seed"),
    revision: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("create"),
    revision: z.number().int().nonnegative(),
    ...vacancyFields,
  }),
  z.object({
    type: z.literal("addCandidate"),
    revision: z.number().int().nonnegative(),
    vacancyId: z.uuid(),
    name: text.max(120),
    cv: text.min(30).max(30000),
  }),
  z.object({
    type: z.literal("analyze"),
    revision: z.number().int().nonnegative(),
    vacancyId: z.uuid(),
    candidateId: z.uuid(),
    mode: z.enum(["live", "demo"]),
  }),
  z.object({
    type: z.literal("saveAssessment"),
    revision: z.number().int().nonnegative(),
    vacancyId: z.uuid(),
    assessment: z.object({
      stages: z.tuple([text.max(12000), text.max(12000), text.max(12000)]),
      materials: text.max(16000),
      duration: z.number().int().min(5).max(120),
      criteria: z.array(text.max(500)).min(1).max(15),
    }),
    approve: z.boolean(),
  }),
]);
export type WorkspaceAction = z.infer<typeof actionSchema>;
