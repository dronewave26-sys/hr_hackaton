import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createHash } from "node:crypto";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(), cookieSet: vi.fn(), getUser: vi.fn(), createServerClient: vi.fn(), localGet: vi.fn(), localChange: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookieGet, set: mocks.cookieSet, getAll: () => [] }) }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.createServerClient }));
vi.mock("../../src/lib/local-store", () => ({ LocalStore: class { get = mocks.localGet; change = mocks.localChange; } }));
import { context, requireSameOrigin } from "../../src/lib/server/context";

const request = (url = "http://localhost/api/workspace", origin?: string) => new NextRequest(url, { headers: origin ? { origin } : {} });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
  vi.stubEnv("ANTHROPIC_API_KEY", "");
  vi.stubEnv("ANTHROPIC_MODEL", "");
  vi.stubEnv("LOCAL_DEMO_MODE", "true");
  vi.stubEnv("NODE_ENV", "test");
  mocks.cookieGet.mockReturnValue(undefined);
  mocks.localGet.mockResolvedValue({ revision: 0, vacancies: [] });
});
afterEach(() => vi.unstubAllEnvs());

describe("local mode isolation", () => {
  it("creates an opaque private cookie and hashes it for storage", async () => {
    const ctx = await context(request());
    await ctx.get();
    expect(ctx.config.storage).toBe("local");
    expect(ctx.config.aiReady).toBe(false);
    const [, secret, options] = mocks.cookieSet.mock.calls[0];
    expect(secret).toMatch(/^[a-f0-9]{64}$/);
    expect(options).toMatchObject({ httpOnly: true, sameSite: "strict", secure: false });
    expect(mocks.localGet).toHaveBeenCalledWith(createHash("sha256").update(secret).digest("hex"));
  });
  it("uses the current owner's cookie without creating a new one", async () => {
    const secret = "a".repeat(64);
    mocks.cookieGet.mockReturnValue({ value: secret });
    await (await context(request())).get();
    expect(mocks.cookieSet).not.toHaveBeenCalled();
    expect(mocks.localGet).toHaveBeenCalledWith(createHash("sha256").update(secret).digest("hex"));
  });
  it("rejects remote hosts even if local demo was explicitly enabled", async () => {
    await expect(context(request("https://example.com/api/workspace"))).rejects.toMatchObject({ status: 503 });
  });
  it("does not silently enable local storage in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("LOCAL_DEMO_MODE", "");
    await expect(context(request())).rejects.toMatchObject({ status: 503 });
  });
  it("rejects partial Supabase configuration instead of falling back to demo", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    await expect(context(request())).rejects.toMatchObject({ status: 503 });
  });
  it("does not leak API keys through configuration", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "secret-test-key");
    vi.stubEnv("ANTHROPIC_MODEL", "test-model");
    const ctx = await context(request());
    expect(ctx.config.aiReady).toBe(true);
    expect(JSON.stringify(ctx.config)).not.toContain("secret-test-key");
  });
});

describe("origin validation", () => {
  it("allows exact same origin and rejects absent or cross origin", () => {
    expect(() => requireSameOrigin(request("http://localhost/api", "http://localhost"))).not.toThrow();
    expect(() => requireSameOrigin(request("http://localhost/api", "https://attacker.example"))).toThrow();
    expect(() => requireSameOrigin(request())).toThrow();
  });
});

describe("Supabase identity verification", () => {
  it("requires getUser to verify an HR before reading any data", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable");
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: "expired" } });
    mocks.createServerClient.mockReturnValue({ auth: { getUser: mocks.getUser } });
    await expect(context(request())).rejects.toMatchObject({ status: 401 });
    expect(mocks.getUser).toHaveBeenCalledOnce();
  });
  it("scopes database reads and optimistic updates to the verified user", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable");
    const queries: { filters: unknown[][]; update?: unknown }[] = [];
    const from = vi.fn(() => {
      const record: { filters: unknown[][]; update?: unknown } = { filters: [] };
      queries.push(record);
      const chain = {
        select: () => record.update ? Promise.resolve({ data: [], error: null }) : chain,
        eq: (...args: unknown[]) => { record.filters.push(args); return chain; },
        maybeSingle: async () => ({ data: { revision: 2, data: { vacancies: [] } }, error: null }),
        update: (value: unknown) => { record.update = value; return chain; },
      };
      return chain;
    });
    mocks.getUser.mockResolvedValue({ data: { user: { id: "verified-owner", email: "demo@example.invalid" } }, error: null });
    mocks.createServerClient.mockReturnValue({ auth: { getUser: mocks.getUser }, from });
    const ctx = await context(request());
    await expect(ctx.change((value) => value)).rejects.toMatchObject({ status: 409 });
    expect(queries[0].filters).toContainEqual(["owner_id", "verified-owner"]);
    expect(queries[1].filters).toEqual([["owner_id", "verified-owner"], ["revision", 2]]);
  });
  it("rejects corrupt stored JSON without silently resetting it", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable");
    const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: { revision: 1, data: { vacancies: "corrupt" } }, error: null }) };
    mocks.getUser.mockResolvedValue({ data: { user: { id: "verified-owner" } }, error: null });
    mocks.createServerClient.mockReturnValue({ auth: { getUser: mocks.getUser }, from: () => chain });
    await expect((await context(request())).get()).rejects.toMatchObject({ status: 503 });
  });
});
