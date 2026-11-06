# SkillProof AI — işə salma

Cari əhatə: HR vakansiyaları, mənbəli CV təhlili, təsdiqli sınaq, ayrıca namizəd keçidi, server taymeri, üç mərhələ/avtosaxlama və cavabdan sitatlarla praktik Claude hesabatı. Son deploy və real xidmət yoxlamaları [CLOUD_STATUS.md](CLOUD_STATUS.md)-dədir.

## Lokal demo

1. `npm ci`
2. `npm run dev`
3. Terminaldakı `http://127.0.0.1:3000` keçidini aç.
4. **Satış nümunəsini aç** və ya **SOC nümunəsini aç** düyməsinə bas. Seçilən vakansiya öz CV və tapşırığı ilə açılır; lazım olduqda uydurma nümunələr əvvəlcə yüklənir.

Supabase qurulmayanda development rejimində lokal demo localhost üçün açılır. Məlumat `.data/workspace.json` daxilində saxlanır və brauzerin gizli demo kukisi ilə ayrılır. Bu, Supabase HR autentifikasiyasını və çox prosesli istehsalat bazasını əvəz etmir. Kukini silmək və ya başqa brauzer açmaq əvvəlki demo iş sahəsinə girişi itirir. `.data` Git-dən kənardadır; uydurma məlumatdan istifadə et.

Production build ilə lokal demo yoxlamaq üçün `.env.example` faylını `.env.local` adı ilə kopyala və `LOCAL_DEMO_MODE=true` saxla. Bu rejim uzaq host üçün açılmır. `npm run build` və sonra `npm start` işlət.

## Claude bağlantısı

`.env.local` daxilində `ANTHROPIC_API_KEY` və hesabına açıq modelin dəqiq adını `ANTHROPIC_MODEL` kimi qur. Açarı çata, sənədə və Git-ə yazma. Serveri yenidən başlat.

Bu hesabda Models API ilə təsdiqlənmiş ID `claude-haiku-5-5`-dir; `Haiku5.5` API ID-si deyil. Windows-da `powershell -NoProfile -File scripts/configure-claude.ps1` açarı gizli terminal sorğusu ilə qəbul edib lokal fayla və bağlı Vercel layihəsinin üç mühitinə ötürür. Əvvəl düzgün Vercel hesabı/layihəsi ilə giriş edilmiş olmalıdır.

Tətbiq konfiqurasiya olduqda canlı təhlil düyməsini açır; bu göstərici real API sorğusunun uğurla keçdiyini hələ təsdiqləmir. Yanlış model, limit, bağlantı və ya yararsız AI nəticəsi aydın xəta verir; CV qorunur. Hər sitat CV mətnində yoxlanır. Sınaqdan keçmiş canlı sorğu olmadan AI inteqrasiyasını yoxlanmış sayma.

Saxlanmış demo təhlili yalnız dəyişdirilməmiş nümunə CV-lər üçün verilir və ayrıca işarələnir. Yeni CV üçün hazır hesabat və ya uydurma AI nəticəsi yoxdur.

Rəsmi mənbə: [Claude API açarının qurulması](https://platform.claude.com/docs/en/get-api-key).

## Supabase HR girişi və saxlama

1. İstifadə edəcəyin ayrıca Supabase layihəsini seç.
2. `supabase/migrations/001_workspace.sql`, `002_candidate_sessions.sql`, `003_practical_reports.sql` fayllarını bu ardıcıllıqla bir dəfə tətbiq et. Hazır layihədə hamısı artıq tətbiq edilib; təkrar icra etmə.
3. Supabase Auth-da HR istifadəçisi yarat və təsdiq et. Bu versiya özbaşına qeydiyyat və e-poçt göndərmir.
4. `.env.local` daxilində `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` və yalnız server üçün `SUPABASE_SECRET_KEY` qur; serveri yenidən başlat.
5. HR istifadəçisinin e-poçt/şifrəsi ilə tətbiqə daxil ol.

URL və publishable açar birlikdə tələb olunur. Namizəd sessiyası və hesabatın server əməliyyatları əlavə secret açarı tələb edir; bu açara `NEXT_PUBLIC_` prefiksi vermə. Supabase qurulanda lokal demo saxlama avtomatik istifadə edilmir. Lokal demo məlumatları Supabase-ə avtomatik köçürülmür. HR sahiblik sərhədləri serverdə və RLS ilə yoxlanır.

Rəsmi mənbə: [Supabase SSR müştərisi](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs).

## Paralel AI işləri

`TEAM_WORKFLOW.md` branch, fayl sahibliyi və ortaq API müqaviləsini müəyyən edir. Yeni AI işi başlamazdan əvvəl onu oxumalıdır. Paketlər və ortaq tiplər inteqrasiya roluna aiddir. Hazır nəticə ayrı branch-dən `main`-ə birləşdirilib birlikdə yoxlanır.

## Yoxlamalar

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- Lokal server açıq olduqda `npm run test:api`
- Build hazır olduqda `npm run test:integration` ayrıca production serveri başladır, real HTTP yoxlamasını keçir və öz serverini dayandırır. GitHub CI-də də bu yoxlama işləyir.
- `npm run test:candidate` namizəd axınını, siyahını, sahiblik sərhədini və Claude qurulmayanda cavabların qorunmasını real HTTP ilə yoxlayır.

`.env.local` real Supabase ilə qurulubsa, lokal demo HTTP testlərindən əvvəl `npm run build:test` işlət. Next.js `NEXT_PUBLIC_*` dəyişənlərini build zamanı sabitləşdirir; onları yalnız test serverində boşaltmaq kifayət etmir. Bu əmr env faylını dəyişmir. Sonra real buludla lokal production işlətmək üçün yenidən `npm run build` et. Vercel öz production dəyişənləri ilə ayrıca build edir.

`test:api` hər dəfə ayrıca demo brauzer kukisi ilə yalnız uydurma məlumat yaradır. Əsas iş sahəsini və real Supabase məlumatlarını yoxlamaq üçün nəzərdə tutulmayıb. Lokal `.data` daxilində testə aid ayrıca iş sahəsi qala bilər.

Canlı xidmət yoxlamalarının nəticəsi `CLOUD_STATUS.md`-dədir. `VALIDATION_PLAN.md` ilkin qəbul planıdır; bütün maddələrin tamamlandığı iddia edilmir.
