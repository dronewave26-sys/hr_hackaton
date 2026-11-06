import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AppError } from "../../src/lib/server/errors";

const mocks = vi.hoisted(() => ({
  configured: vi.fn(),
  origin: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  client: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/context", () => ({
  requireSameOrigin: mocks.origin,
  supabaseConfigured: mocks.configured,
  supabaseServer: mocks.client,
}));
import { POST } from "../../src/app/api/auth/route";
const post = (body: object) =>
  POST(
    new NextRequest("http://localhost/api/auth", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
      },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.origin.mockImplementation(() => {});
  mocks.configured.mockReturnValue(true);
  mocks.signIn.mockResolvedValue({ error: null });
  mocks.signOut.mockResolvedValue({ error: null });
  mocks.client.mockResolvedValue({
    auth: { signInWithPassword: mocks.signIn, signOut: mocks.signOut },
  });
});

describe("HR auth endpoint", () => {
  it("preserves origin rejection before calling Supabase", async () => {
    mocks.origin.mockImplementation(() => {
      throw new AppError("Forbidden", 403);
    });
    expect(
      (await post({ email: "demo@example.invalid", password: "demo" })).status,
    ).toBe(403);
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("returns configuration unavailable rather than a login error", async () => {
    mocks.configured.mockReturnValue(false);
    expect((await post({ type: "logout" })).status).toBe(503);
  });
  it("validates credentials before sending them to the provider", async () => {
    expect((await post({ email: "wrong", password: "" })).status).toBe(400);
    expect(mocks.signIn).not.toHaveBeenCalled();
  });
  it("accepts login and does not return credentials", async () => {
    const response = await post({
      type: "login",
      email: "demo@example.invalid",
      password: "secret",
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("hides provider error details from failed sign in", async () => {
    mocks.signIn.mockResolvedValue({
      error: { message: "sensitive provider detail" },
    });
    const response = await post({
      email: "demo@example.invalid",
      password: "secret",
    });
    expect(response.status).toBe(401);
    expect(await response.text()).not.toContain("sensitive provider detail");
  });
  it("logs out the current Supabase session", async () => {
    expect((await post({ type: "logout" })).status).toBe(200);
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });
});
