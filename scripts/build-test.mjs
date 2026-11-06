// NEXT_PUBLIC values are inlined by Next.js at build time. Create an isolated
// local-demo artifact without modifying the developer's .env.local file.
import { spawnSync } from "node:child_process";

const result = spawnSync(
  process.execPath,
  ["node_modules/next/dist/bin/next", "build"],
  {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      SUPABASE_SECRET_KEY: "",
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_MODEL: "",
    },
    stdio: "inherit",
  },
);
process.exit(result.status ?? 1);
