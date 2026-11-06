import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

export const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

/** Count streamed bytes before buffering: Content-Length is not a trusted limit. */
export async function readJSON(request: Request, maximumBytes = 100_000): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new AppError("Sorğunu JSON formatında göndərin.", 415);
  }
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && Number(declaredLength) > maximumBytes) throw new AppError("Sorğu çox böyükdür.", 413);
  if (!request.body) throw new AppError("Sorğu boşdur.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximumBytes) {
        await reader.cancel().catch(() => {});
        throw new AppError("Sorğu çox böyükdür.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new AppError("Sorğu formatı yanlışdır."); }
}

export function failure(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues[0]?.message ?? "Məlumatı yoxlayın." }, { status: 400, headers: privateHeaders });
  }
  return NextResponse.json(
    { error: error instanceof AppError ? error.message : "Əməliyyat alınmadı. Yenidən cəhd edin." },
    { status: error instanceof AppError ? error.status : 500, headers: privateHeaders },
  );
}
