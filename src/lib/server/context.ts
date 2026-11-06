import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createHash, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { LocalStore } from "../local-store";
import { join } from "node:path";
import {
  emptyWorkspace,
  workspaceSchema,
  type Workspace,
  type AppConfig,
} from "../domain";
import { AppError } from "./errors";

export { AppError } from "./errors";
export const supabaseConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

export async function supabaseServer() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (items) =>
          items.forEach(({ name, value, options }) =>
            jar.set(name, value, options),
          ),
      },
    },
  );
}

export async function context(request: NextRequest) {
  const aiReady = Boolean(
    process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_MODEL,
  );
  if (supabaseConfigured()) {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user)
      throw new AppError("Davam etmək üçün HR hesabına daxil olun.", 401);
    const owner = data.user.id;
    const config: AppConfig = {
      storage: "supabase",
      aiReady,
      model: process.env.ANTHROPIC_MODEL || null,
      account: data.user.email ?? null,
    };
    const get = async (): Promise<Workspace> => {
      const { data: row, error } = await supabase
        .from("skillproof_workspaces")
        .select("revision,data")
        .eq("owner_id", owner)
        .maybeSingle();
      if (error)
        throw new AppError(
          "Supabase məlumatı oxunmadı. SETUP.md üzrə bazanın qurulduğunu yoxlayın.",
          503,
        );
      if (!row) return emptyWorkspace();
      const parsed = workspaceSchema.safeParse({
        revision: row.revision,
        vacancies: row.data?.vacancies,
      });
      if (!parsed.success)
        throw new AppError(
          "Saxlanmış məlumatın formatı yanlışdır. Məlumatı silmədən bazanı yoxlayın.",
          503,
        );
      return parsed.data;
    };
    const change = async (transform: (workspace: Workspace) => Workspace) => {
      const current = await get();
      const next = transform(structuredClone(current));
      next.revision = current.revision + 1;
      workspaceSchema.parse(next);
      if (current.revision === 0) {
        const { error } = await supabase
          .from("skillproof_workspaces")
          .insert({
            owner_id: owner,
            revision: next.revision,
            data: { vacancies: next.vacancies },
          });
        if (error)
          throw new AppError(
            error.code === "23505"
              ? "Məlumat başqa pəncərədə dəyişib. Yeniləyib təkrar cəhd edin."
              : "Supabase məlumatı saxlanmadı. Bağlantı və giriş qaydalarını yoxlayın.",
            error.code === "23505" ? 409 : 503,
          );
      } else {
        const { data, error } = await supabase
          .from("skillproof_workspaces")
          .update({
            revision: next.revision,
            data: { vacancies: next.vacancies },
          })
          .eq("owner_id", owner)
          .eq("revision", current.revision)
          .select("owner_id");
        if (error)
          throw new AppError(
            "Supabase məlumatı saxlanmadı. Bağlantı və giriş qaydalarını yoxlayın.",
            503,
          );
        if (!data?.length)
          throw new AppError(
            "Məlumat başqa pəncərədə dəyişib. Yeniləyib təkrar cəhd edin.",
            409,
          );
      }
      return next;
    };
    return { config, get, change };
  }
  if (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) !==
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  ) {
    throw new AppError("Supabase URL və açarı birlikdə qurulmalıdır.", 503);
  }
  const localHost = ["localhost", "127.0.0.1", "[::1]"].includes(
    requestOrigin(request).hostname,
  );
  const localEnabled =
    process.env.LOCAL_DEMO_MODE === "true" ||
    (process.env.NODE_ENV !== "production" &&
      process.env.LOCAL_DEMO_MODE !== "false");
  if (!localHost || !localEnabled)
    throw new AppError(
      "Bu mühitdə Supabase qurulmalıdır. Lokal demo yalnız localhost üçün açıqdır.",
      503,
    );
  const jar = await cookies();
  let secret = jar.get("sp_demo_owner")?.value;
  if (!secret || !/^[a-f0-9]{64}$/.test(secret)) {
    secret = randomBytes(32).toString("hex");
    jar.set("sp_demo_owner", secret, {
      httpOnly: true,
      sameSite: "strict",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  const owner = createHash("sha256").update(secret).digest("hex");
  const store = new LocalStore(join(process.cwd(), ".data", "workspace.json"));
  const config: AppConfig = {
    storage: "local",
    aiReady,
    model: process.env.ANTHROPIC_MODEL || null,
    account: null,
  };
  return {
    config,
    get: () => store.get(owner),
    change: (transform: (workspace: Workspace) => Workspace) =>
      store.change(owner, transform),
  };
}

function requestOrigin(request: NextRequest): URL {
  // Next can normalize loopback nextUrl hosts to localhost. The actual Host
  // preserves the browser-facing authority; never substitute forwarded headers.
  const host = request.headers.get("host") ?? request.nextUrl.host;
  const protocol = request.nextUrl.protocol;
  if (
    !host ||
    !/^[a-z0-9.\-:[\]]+$/i.test(host) ||
    !["http:", "https:"].includes(protocol)
  ) {
    throw new AppError("Sorğunun mənbəyi təsdiqlənmədi.", 403);
  }
  try {
    return new URL(`${protocol}//${host}`);
  } catch {
    throw new AppError("Sorğunun mənbəyi təsdiqlənmədi.", 403);
  }
}

export function requireSameOrigin(request: NextRequest) {
  const rawOrigin = request.headers.get("origin");
  if (!rawOrigin || !/^https?:\/\/[^/?#@\\\s]+$/i.test(rawOrigin)) {
    throw new AppError("Sorğunun mənbəyi təsdiqlənmədi.", 403);
  }
  let origin: URL;
  try {
    origin = new URL(rawOrigin);
  } catch {
    throw new AppError("Sorğunun mənbəyi təsdiqlənmədi.", 403);
  }
  if (origin.origin !== requestOrigin(request).origin)
    throw new AppError("Sorğunun mənbəyi təsdiqlənmədi.", 403);
}
