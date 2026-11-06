# SkillProof AI — paralel AI iş qaydası

İstifadəçinin istəyi ilə iş üç istiqamətdə paralel aparılır. `main` yalnız inteqrasiya və yoxlama üçündür. Hər AI ayrıca branch və worktree-də işləyir; başqa AI-nin fayllarını dəyişmir.

## İş bölgüsü

| İcraçı | Branch | Sahib olduğu fayllar | Nəticə |
| --- | --- | --- | --- |
| İnterfeys AI | `ai/frontend` | `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/components/**` | Azərbaycan dilində HR paneli, vakansiya/CV/sınaq layihəsi ekranları |
| Server AI | `ai/backend` | `src/app/api/**`, `src/lib/server/**`, `supabase/**`, `tests/backend/**` | Giriş və məlumat sərhədləri, Claude, saxlama API-si, server yoxlamaları |
| İnteqrasiya AI | `main` | `src/lib/domain.ts`, `src/lib/fixtures.ts`, `src/lib/local-store.ts`, `tests/core/**`, konfiqurasiya, lockfile, CI və sənədlər | Ortaq müqavilə, inteqrasiya, ümumi yoxlamalar və birləşdirmə |

Ortaq fayla ehtiyac yaranarsa əvvəl inteqrasiya AI-yə yazılır. `package.json` və lockfile yalnız inteqrasiya AI tərəfindən dəyişdirilir. API formatı razılaşdırılmadan dəyişdirilmir. Heç bir AI başqa worktree-də checkout, reset, clean və ya force push etmir.

## Yeni iş: namizəd modulu

İstifadəçi namizəd tərəfini dostunun Codex-i ilə hazırlayacaq. `ai/candidate` branch-i son `origin/main`-dən başlanır. Tam tapşırıq və ilkin API müqaviləsi [CANDIDATE_HANDOFF.md](CANDIDATE_HANDOFF.md)-dədir.

Bu iş üçün `src/app/candidate/**`, `src/components/candidate/**`, `src/app/api/candidate/**`, `src/app/api/candidate-invitations/**`, `src/lib/candidate/**`, `src/lib/server/candidate/**`, `supabase/migrations/002_candidate_sessions.sql`, `tests/candidate/**`, `scripts/candidate-smoke.mjs` və `CANDIDATE_IMPLEMENTATION.md` namizəd icraçısına ayrılır. Bu konkret istisnalar yuxarıdakı ümumi frontend/backend sahibliyindən üstündür. Digər AI-lər həmin faylları paralel dəyişməməlidir.

Namizəd icraçısı mövcud HR ekranını, workspace API-sini, ortaq domain/konfiqurasiyanı və 001 miqrasiyasını dəyişmir. HR ekranına qoşulma, ortaq env/CI dəyişiklikləri və final birləşdirmə inteqrasiya roluna aiddir. Namizəd modulu və yekun praktik AI hesabatı hazır kimi təqdim edilmir; bu sənəd yalnız iş bölgüsünü müəyyənləşdirir.

## Bu mərhələnin dəqiq əhatəsi

HR vakansiya yaradır, bacarıqları daxil edir, CV saxlayır və mənbəli təhlil alır. Satış və SOC üçün uydurma nümunələr ayrıca yüklənir. Sınağın üç mərhələsi, materialı, müddəti və meyarları redaktə və HR təsdiqi ilə saxlanır.

Namizədin ayrıca keçidi, server sınaq taymeri və yekun praktik cavab hesabatı növbəti mərhələdir. Hazır olmayan funksiyalar işlək kimi göstərilmir. Deploy bu işə daxil deyil.

## Ortaq API müqaviləsi

Tiplərin əsas mənbəyi `src/lib/domain.ts`-dir; onu kopyalayıb ayrıca tip yaratma.

- `GET /api/workspace`: `{ workspace: Workspace, config: AppConfig }` qaytarır. Məlumatlar şəxsi və keşsizdir.
- `POST /api/workspace`: `WorkspaceAction` və cari `revision` qəbul edir; uğurda eyni formatı qaytarır.
- Hərəkətlər: `seed`, `create`, `addCandidate`, `analyze`, `saveAssessment`.
- Xəta: `{ error: string }`; 400 giriş, 401 HR girişi, 403 mənbə/icazə, 404 obyekt yoxdur, 409 köhnə revision, 502/503 xarici xidmət və ya konfiqurasiya.
- 409 gəldikdə interfeys son məlumatı yenidən yükləyir və istifadəçiyə təkrar cəhd mesajı verir; formanın yazılmış mətni itirilmir.
- `POST /api/auth`: e-poçt/şifrə ilə giriş; `{ type: "logout" }` ilə çıxış.
- `analysis.source`: `claude` — canlı sorğu; `saved-demo` — əvvəlcədən hazırlanmış nümunə. Hər iki hal ekranda fərqləndirilir.
- Supabase qurulmayıbsa demo yalnız localhost və icazəli lokal rejimdə işləyir. Real HR girişi kimi təqdim edilmir.

## Birləşdirmə ardıcıllığı

1. Hər AI yalnız öz fayllarını commit edir və dəyişikliklərini inteqrasiya AI-yə bildirir.
2. İnterfeys və server branch-ləri `main`-ə ardıcıl birləşdirilir. Konflikt yaranarsa səbəbi araşdırılaraq həll edilir.
3. `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` işlədilir.
4. Lokal brauzerdə nümunə yükləmə → vakansiya → CV → demo təhlili → sınaq layihəsi təsdiqi axını yoxlanır.
5. GitHub-a yalnız birləşdirilmiş və yoxlanmış vəziyyət push edilir. Branch-lər də komanda işi üçün saxlanıla bilər.

Yoxlama keçməsi bütün gələcək 22 qəbul meyarının artıq tamamlandığı demək deyil. Real Supabase/Claude üçün konfiqurasiya və ayrıca inteqrasiya sınağı tələb olunur.
