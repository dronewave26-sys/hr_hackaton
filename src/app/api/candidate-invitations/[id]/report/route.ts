import { NextRequest } from "next/server";
import { practicalReport } from "@/lib/server/reports/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return practicalReport(request, (await context.params).id);
}
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return practicalReport(request, (await context.params).id, true);
}
