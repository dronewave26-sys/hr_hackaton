import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  requireSameOrigin,
  supabaseConfigured,
  supabaseServer,
} from "@/lib/server/context";
import { AppError } from "@/lib/server/errors";
import { failure, privateHeaders, readJSON } from "@/lib/server/http";

export const runtime = "nodejs";

const authSchema = z.union([
  z.object({ type: z.literal("logout") }),
  z.object({
    type: z.literal("login").optional(),
    email: z.email().max(254),
    password: z.string().min(1).max(500),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    if (!supabaseConfigured())
      throw new AppError("Əvvəl Supabase konfiqurasiyasını qurun.", 503);
    const body = authSchema.parse(await readJSON(request, 8192));
    const supabase = await supabaseServer();
    if (body.type === "logout") {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });
      if (error)
        throw new AppError(
          "Giriş alınmadı. E-poçt, şifrə və hesab təsdiqini yoxlayın.",
          401,
        );
    }
    return NextResponse.json({ ok: true }, { headers: privateHeaders });
  } catch (error) {
    return failure(error);
  }
}
