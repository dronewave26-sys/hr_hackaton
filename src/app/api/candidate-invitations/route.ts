import { createInvitation } from "@/lib/server/candidate/handlers";
import { listInvitations } from "@/lib/server/reports/handlers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = createInvitation;
export const GET = listInvitations;
