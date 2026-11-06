import type { NextRequest } from "next/server";
import { invitationDetail } from "@/lib/server/candidate/handlers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return invitationDetail(request, (await context.params).id, true);
}
