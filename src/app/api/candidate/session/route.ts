import type { NextRequest } from "next/server";
import { session } from "@/lib/server/candidate/handlers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = (request: NextRequest) => session(request);
export const POST = (request: NextRequest) => session(request, true);
