import { NextRequest, NextResponse } from "next/server";
import {
  actionSchema,
  validateAnalysis,
  type Analysis,
  type Vacancy,
} from "@/lib/domain";
import { createFixtures, savedDemoAnalysis } from "@/lib/fixtures";
import { AppError, context, requireSameOrigin } from "@/lib/server/context";
import { analyzeCV } from "@/lib/server/claude";
import { failure, privateHeaders, readJSON } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = privateHeaders;
export async function GET(request: NextRequest) {
  try {
    const ctx = await context(request);
    return NextResponse.json(
      { workspace: await ctx.get(), config: ctx.config },
      { headers },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const action = actionSchema.parse(await readJSON(request));
    const ctx = await context(request);
    const snapshot = await ctx.get();
    if (snapshot.revision !== action.revision)
      throw new AppError(
        "Məlumat başqa pəncərədə dəyişib. Yeniləyib təkrar cəhd edin.",
        409,
      );
    const find = (items: Vacancy[], id: string) => {
      const found = items.find((item) => item.id === id);
      if (!found) throw new AppError("Vakansiya tapılmadı.", 404);
      return found;
    };
    let analysis: Analysis | undefined;
    if (action.type === "analyze") {
      const vacancy = find(snapshot.vacancies, action.vacancyId);
      const candidate = vacancy.candidates.find(
        (item) => item.id === action.candidateId,
      );
      if (!candidate) throw new AppError("Namizəd tapılmadı.", 404);
      if (action.mode === "live")
        analysis = await analyzeCV(vacancy, candidate);
      else {
        try {
          analysis = {
            ...validateAnalysis(
              savedDemoAnalysis(vacancy, candidate.id),
              vacancy.skills,
              candidate.cv,
            ),
            source: "saved-demo" as const,
            createdAt: new Date().toISOString(),
          };
        } catch {
          throw new AppError(
            "Saxlanmış demo təhlili yalnız dəyişdirilməmiş nümunə CV və meyarlar üçün mövcuddur.",
          );
        }
      }
    }
    const result = await ctx.change((workspace) => {
      if (workspace.revision !== action.revision)
        throw new AppError(
          "Məlumat dəyişib. Yeniləyib yenidən cəhd edin.",
          409,
        );
      switch (action.type) {
        case "seed": {
          const existing = new Set(
            workspace.vacancies.map((item) => item.demoKey),
          );
          workspace.vacancies.push(
            ...createFixtures().filter((item) => !existing.has(item.demoKey)),
          );
          break;
        }
        case "create":
          workspace.vacancies.unshift({
            id: crypto.randomUUID(),
            title: action.title,
            department: action.department,
            description: action.description,
            skills: action.skills,
            createdAt: new Date().toISOString(),
            candidates: [],
          });
          break;
        case "addCandidate":
          find(workspace.vacancies, action.vacancyId).candidates.push({
            id: crypto.randomUUID(),
            name: action.name,
            cv: action.cv,
            createdAt: new Date().toISOString(),
          });
          break;
        case "analyze": {
          const candidate = find(
            workspace.vacancies,
            action.vacancyId,
          ).candidates.find((item) => item.id === action.candidateId);
          if (!candidate || !analysis)
            throw new AppError("Namizəd tapılmadı.", 404);
          candidate.analysis = analysis;
          break;
        }
        case "saveAssessment":
          find(workspace.vacancies, action.vacancyId).assessment = {
            ...action.assessment,
            ...(action.approve ? { approvedAt: new Date().toISOString() } : {}),
          };
          break;
      }
      return workspace;
    });
    return NextResponse.json(
      { workspace: result, config: ctx.config },
      { headers },
    );
  } catch (error) {
    return failure(error);
  }
}
