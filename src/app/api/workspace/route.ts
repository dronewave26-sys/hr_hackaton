import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { actionSchema, validateAnalysis, type Vacancy } from "@/lib/domain";
import { createFixtures, savedDemoAnalysis } from "@/lib/fixtures";
import { AppError, context, requireSameOrigin } from "@/lib/server/context";
import { analyzeCV } from "@/lib/server/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
function failure(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Məlumatı yoxlayın." }, { status: 400, headers });
  return NextResponse.json({ error: error instanceof AppError ? error.message : "Əməliyyat alınmadı. Yenidən cəhd edin." }, { status: error instanceof AppError ? error.status : 500, headers });
}
export async function GET(request: NextRequest) {
  try { const ctx = await context(request); return NextResponse.json({ workspace: await ctx.get(), config: ctx.config }, { headers }); }
  catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const raw = await request.text();
    if (raw.length > 100000) throw new AppError("Sorğu çox böyükdür.", 413);
    let json: unknown;
    try { json = JSON.parse(raw); } catch { throw new AppError("Sorğu formatı yanlışdır."); }
    const action = actionSchema.parse(json);
    const ctx = await context(request);
    const snapshot = await ctx.get();
    if (snapshot.revision !== action.revision) throw new AppError("Məlumat başqa pəncərədə dəyişib. Yeniləyib təkrar cəhd edin.", 409);
    const find = (items: Vacancy[], id: string) => {
      const found = items.find((item) => item.id === id);
      if (!found) throw new AppError("Vakansiya tapılmadı.", 404);
      return found;
    };
    let analysis;
    if (action.type === "analyze") {
      const vacancy = find(snapshot.vacancies, action.vacancyId);
      const candidate = vacancy.candidates.find((item) => item.id === action.candidateId);
      if (!candidate) throw new AppError("Namizəd tapılmadı.", 404);
      analysis = action.mode === "live" ? await analyzeCV(vacancy, candidate) : {
        ...validateAnalysis(savedDemoAnalysis(vacancy, candidate.id), vacancy.skills, candidate.cv), source: "saved-demo" as const, createdAt: new Date().toISOString(),
      };
    }
    const result = await ctx.change((workspace) => {
      if (workspace.revision !== action.revision) throw new AppError("Məlumat dəyişib. Yeniləyib yenidən cəhd edin.", 409);
      switch (action.type) {
        case "seed": {
          const existing = new Set(workspace.vacancies.map((item) => item.demoKey));
          workspace.vacancies.push(...createFixtures().filter((item) => !existing.has(item.demoKey)));
          break;
        }
        case "create": workspace.vacancies.unshift({ id: crypto.randomUUID(), title: action.title, department: action.department, description: action.description, skills: action.skills, createdAt: new Date().toISOString(), candidates: [] }); break;
        case "addCandidate": find(workspace.vacancies, action.vacancyId).candidates.push({ id: crypto.randomUUID(), name: action.name, cv: action.cv, createdAt: new Date().toISOString() }); break;
        case "analyze": {
          const candidate = find(workspace.vacancies, action.vacancyId).candidates.find((item) => item.id === action.candidateId);
          if (!candidate || !analysis) throw new AppError("Namizəd tapılmadı.", 404);
          candidate.analysis = analysis;
          break;
        }
        case "saveAssessment": find(workspace.vacancies, action.vacancyId).assessment = { ...action.assessment, ...(action.approve ? { approvedAt: new Date().toISOString() } : {}) }; break;
      }
      return workspace;
    });
    return NextResponse.json({ workspace: result, config: ctx.config }, { headers });
  } catch (error) { return failure(error); }
}
