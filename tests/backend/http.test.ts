import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { readJSON, failure } from "../../src/lib/server/http";
import { AppError } from "../../src/lib/server/errors";

const jsonRequest = (body: string, headers = {}) => new Request("http://localhost/api", { method: "POST", headers: { "content-type": "application/json; charset=utf-8", ...headers }, body });

describe("bounded JSON request reader", () => {
  it("accepts JSON with Azerbaijani UTF-8 text", async () => {
    await expect(readJSON(jsonRequest('{"name":"Səma"}'))).resolves.toEqual({ name: "Səma" });
  });
  it("rejects non-JSON media types", async () => {
    await expect(readJSON(jsonRequest('{}', { "content-type": "application/json-untrusted" }))).rejects.toMatchObject({ status: 415 });
  });
  it("rejects malformed and empty JSON", async () => {
    await expect(readJSON(jsonRequest('{'))).rejects.toMatchObject({ status: 400 });
    await expect(readJSON(jsonRequest(''))).rejects.toMatchObject({ status: 400 });
  });
  it("rejects oversized declared and actual bodies", async () => {
    await expect(readJSON(jsonRequest('{}', { "content-length": "300" }), 50)).rejects.toMatchObject({ status: 413 });
    await expect(readJSON(jsonRequest('"əəə"'), 5)).rejects.toMatchObject({ status: 413 });
  });
  it("counts streamed bytes even without Content-Length", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({ start(controller) { controller.enqueue(encoder.encode('"abc')); controller.enqueue(encoder.encode('def"')); controller.close(); } });
    const request = new Request("http://localhost/api", { method: "POST", headers: { "content-type": "application/json" }, body: stream, duplex: "half" } as RequestInit);
    await expect(readJSON(request, 6)).rejects.toMatchObject({ status: 413 });
  });
});

describe("private error responses", () => {
  it("preserves intended status and hides unexpected internals", async () => {
    expect(failure(new AppError("Forbidden", 403)).status).toBe(403);
    const response = failure(new Error("super-secret-token"));
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.text()).not.toContain("super-secret-token");
  });
});
