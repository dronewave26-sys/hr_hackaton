import "server-only";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { context, requireSameOrigin, supabaseServer } from "../context";
import { privateHeaders, readJSON } from "../http";
import { AppError } from "../errors";
import {
  exchangeSchema,
  invitationSchema,
  mutationSchema,
  sessionQuerySchema,
  revokeSchema,
} from "@/lib/candidate/contracts";
import {
  authorize,
  CandidateError,
  createRecord,
  fail,
  hash,
  hrView,
  matches,
  secret,
  transition,
  view,
} from "./model";
import { storeFor } from "./store";

const COOKIE = "sp_candidate";
const headers = { ...privateHeaders, "Referrer-Policy": "no-referrer" };
export async function handled(action: () => Promise<NextResponse>) {
  try {
    return await action();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof ZodError
            ? "Sorğunun formatını yoxlayın."
            : error instanceof AppError
              ? error.message
              : "Saxlama xidməti əlçatan deyil. Təkrar cəhd edin.",
        code:
          error instanceof CandidateError
            ? error.code
            : error instanceof ZodError
              ? "INVALID_INPUT"
              : "REQUEST_FAILED",
      },
      {
        status:
          error instanceof ZodError
            ? 400
            : error instanceof AppError
              ? error.status
              : 503,
        headers,
      },
    );
  }
}
async function hr(request: NextRequest) {
  const ctx = await context(request);
  let owner: string;
  if (ctx.config.storage === "supabase") {
    const { data, error } = await (await supabaseServer()).auth.getUser();
    if (error || !data.user)
      fail("HR girişi tələb olunur.", 401, "UNAUTHORIZED");
    owner = data.user.id;
  } else {
    const token = (await cookies()).get("sp_demo_owner")?.value;
    if (!token) fail("HR iş sahəsini əvvəlcə açın.", 401, "UNAUTHORIZED");
    owner = hash(token);
  }
  return { ctx, owner };
}
export function createInvitation(request: NextRequest) {
  return handled(async () => {
    requireSameOrigin(request);
    const input = invitationSchema.parse(await readJSON(request, 4096));
    const { ctx, owner } = await hr(request);
    const store = storeFor(request);
    const prior = await store.lookup(owner, input.requestId);
    if (prior) {
      if (prior.createHash !== hash(JSON.stringify(input)))
        fail(
          "Sorğu identifikatoru fərqli məlumatla istifadə edilib.",
          409,
          "REQUEST_REUSED",
        );
      return NextResponse.json(
        {
          invitationId: prior.id,
          invitationExpiresAt: prior.invitationExpiresAt,
          url: null,
          replayed: true,
        },
        { headers },
      );
    }
    const { record, token } = createRecord(
      owner,
      input,
      await ctx.get(),
      Date.now(),
    );
    const result = await store.create(record);
    const origin = request.headers.get("origin")!;
    return NextResponse.json(
      {
        invitationId: result.record.id,
        invitationExpiresAt: result.record.invitationExpiresAt,
        url: result.created
          ? `${origin}/candidate/${record.id}#${token}`
          : null,
        replayed: !result.created,
      },
      { headers },
    );
  });
}
export function invitationDetail(
  request: NextRequest,
  id: string,
  revoke = false,
) {
  return handled(async () => {
    z.uuid().parse(id);
    if (revoke) {
      requireSameOrigin(request);
      revokeSchema.parse(await readJSON(request, 1024));
    }
    const { owner } = await hr(request);
    const result = await storeFor(request).change(id, (record, now) => {
      if (record.owner !== owner) fail("Dəvət tapılmadı.", 404, "NOT_FOUND");
      if (revoke && record.status !== "revoked") {
        record.status = "revoked";
        record.revision++;
      }
      return hrView(record, now);
    });
    return NextResponse.json({ invitation: result }, { headers });
  });
}
export function exchange(request: NextRequest) {
  return handled(async () => {
    requireSameOrigin(request);
    const input = exchangeSchema.parse(await readJSON(request, 4096));
    const store = storeFor(request);
    // Per-invitation shared bucket: independent of spoofable forwarded IP headers.
    await store.limit(hash(input.invitationId));
    const token = secret();
    const result = await store.change(input.invitationId, (record, now) => {
      if (!matches(input.secret, record.secretHash))
        fail("Dəvət keçidi etibarsızdır.", 410, "INVALID_INVITATION");
      if (
        record.status === "revoked" ||
        Date.parse(record.invitationExpiresAt) <= now
      )
        fail("Dəvət bitib və ya ləğv edilib.", 410, "INVITATION_EXPIRED");
      record.sessionHashes.push({
        hash: hash(token),
        expiresAt: now + 7 * 86400000,
      });
      record.sessionHashes = record.sessionHashes.slice(-8);
      return view(record, now);
    });
    const response = NextResponse.json({ session: result }, { headers });
    response.cookies.set(COOKIE, `${input.invitationId}.${token}`, {
      httpOnly: true,
      sameSite: "strict",
      secure: request.nextUrl.protocol === "https:",
      path: "/api/candidate",
      maxAge: 7 * 86400,
    });
    return response;
  });
}
export function session(request: NextRequest, write = false) {
  return handled(async () => {
    if (write) requireSameOrigin(request);
    const action = write
      ? mutationSchema.parse(await readJSON(request, 125000))
      : null;
    const { invitationId } =
      action ??
      sessionQuerySchema.parse({
        invitationId: request.nextUrl.searchParams.get("invitationId"),
      });
    const cookie = request.cookies.get(COOKIE)?.value ?? "";
    const [cookieId, token] = cookie.split(".");
    if (cookieId !== invitationId || !token || !/^[a-f0-9]{64}$/.test(token))
      fail(
        "Sessiya uyğun gəlmir. Bu dəvətin tam keçidini yenidən açın.",
        401,
        "SESSION_MISMATCH",
      );
    const result = await storeFor(request).change(
      invitationId,
      (record, now) => {
        authorize(record, token, now);
        if (action) transition(record, action, now);
        return view(record, now);
      },
    );
    return NextResponse.json({ session: result }, { headers });
  });
}
