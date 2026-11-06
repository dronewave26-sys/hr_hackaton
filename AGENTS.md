<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## SkillProof AI iş qaydaları

- İşə başlamazdan əvvəl `TEAM_WORKFLOW.md`, `SETUP.md` və `IMPLEMENTATION_STATUS.md` oxu.
- Paralel işdə öz branch və worktree-indən istifadə et; ortaq tipləri və paketləri inteqrasiya rolu ilə razılaşdırmadan dəyişmə.
- İstifadəçi ilə Azərbaycan dilində danış. Sirr dəyərlərini çıxışa, çata və Git-ə yazma.
- CV/demoya aid mənbə sitatlarını yoxla; saxlanmış demonun canlı Claude nəticəsi kimi göstərilməsinə yol vermə.
- Supabase qurulmayanda lokal demo yalnız loopback hostunda işləyir. Bu rejimi istehsalat HR autentifikasiyası kimi təqdim etmə.
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` və əsas axın dəyişibsə `npm run test:integration` yoxlamalarını tamamla.
- Hazır olmayan namizəd sessiyası, taymer və praktik hesabatı işlək kimi göstərmə. Deploy ayrıca istifadəçi tapşırığı tələb edir.
