import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin, supabaseConfigured, supabaseServer } from "@/lib/server/context";

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    if (!supabaseConfigured()) return NextResponse.json({ error: "Əvvəl Supabase konfiqurasiyasını qurun." }, { status: 503 });
    const body = await request.json();
    const supabase = await supabaseServer();
    if (body.type === "logout") {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      const input = z.object({ email: z.email(), password: z.string().min(1).max(500) }).parse(body);
      const { error } = await supabase.auth.signInWithPassword(input);
      if (error) return NextResponse.json({ error: "Giriş alınmadı. E-poçt, şifrə və hesab təsdiqini yoxlayın." }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Giriş sorğusu alınmadı." }, { status: 400 }); }
}
