import { z } from "zod";
import { errorSchema } from "./contracts";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  url: string,
  schema: z.ZodType<T>,
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = errorSchema.safeParse(data);
    throw new ApiError(
      error.success ? error.data.error : "Sorğu alınmadı.",
      response.status,
      error.success ? error.data.code : "REQUEST_FAILED",
    );
  }
  return schema.parse(data);
}
