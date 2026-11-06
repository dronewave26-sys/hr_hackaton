// Exercise real production route handlers without cloud accounts or a browser.
import { spawn, execFile } from "node:child_process";
import { once } from "node:events";
import { promisify } from "node:util";
import { setTimeout as pause } from "node:timers/promises";

const port = 3187;
const base = `http://127.0.0.1:${port}`;
const environment = {
  ...process.env,
  LOCAL_DEMO_MODE: "true",
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
  ANTHROPIC_API_KEY: "",
  ANTHROPIC_MODEL: "",
  SKILLPROOF_TEST_URL: base,
};
let output = "";
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  { env: environment, stdio: ["ignore", "pipe", "pipe"] },
);
const stopped = once(server, "exit");
for (const stream of [server.stdout, server.stderr])
  stream.on("data", (chunk) => {
    output = (output + chunk.toString()).slice(-8000);
  });
try {
  const deadline = Date.now() + 45000;
  let ready = false;
  while (Date.now() < deadline && server.exitCode === null) {
    try {
      const response = await fetch(base, { signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* The server may still be starting. */
    }
    await pause(250);
  }
  if (!ready)
    throw new Error(`Production server did not become ready.\n${output}`);
  const result = await promisify(execFile)(
    process.execPath,
    ["scripts/smoke-api.mjs"],
    { env: environment, timeout: 45000 },
  );
  process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
} finally {
  if (server.exitCode === null) server.kill("SIGTERM");
  await stopped;
}
