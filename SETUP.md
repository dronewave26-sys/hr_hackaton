# SkillProof AI — işə salma

Bu mərhələnin əhatəsi: HR vakansiyaları, CV saxlanması və mənbəli təhlil, sınaq layihəsinin redaktəsi/təsdiqi. Namizəd keçidi, server taymeri və yekun praktik hesabat növbəti mərhələdir. Deploy edilməyib.

## Lokal demo

1. `npm ci`
2. `npm run dev`
3. Terminaldakı `http://127.0.0.1:3000` keçidini aç.
4. Uydurma satış və SOC məlumatlarını tətbiqdəki ayrıca demo düyməsi ilə yüklə.

Supabase qurulmayanda development rejimində lokal demo localhost üçün açılır. Məlumat `.data/workspace.json` daxilində saxlanır və brauzerin gizli demo kukisi ilə ayrılır. Bu, Supabase HR autentifikasiyasını və çox prosesli istehsalat bazasını əvəz etmir. Kukini silmək və ya başqa brauzer açmaq əvvəlki demo iş sahəsinə girişi itirir. `.data` Git-dən kənardadır; uydurma məlumatdan istifadə et.

Production build ilə lokal demo yoxlamaq üçün `.env.example` faylını `.env.local` adı ilə kopyala və `LOCAL_DEMO_MODE=true` saxla. Bu rejim uzaq host üçün açılmır. `npm run build` və sonra `npm start` işlət.

## Claude bağlantısı

`.env.local` daxilində `ANTHROPIC_API_KEY` və hesabına açıq modelin dəqiq adını `ANTHROPIC_MODEL` kimi qur. Açarı çata, sənədə və Git-ə yazma. Serveri yenidən başlat.

Tətbiq konfiqurasiya olduqda canlı təhlil düyməsini açır; bu göstərici real API sorğusunun uğurla keçdiyini hələ təsdiqləmir. Yanlış model, limit, bağlantı və ya yararsız AI nəticəsi aydın xəta verir; CV qorunur. Hər sitat CV mətnində yoxlanır. Sınaqdan keçmiş canlı sorğu olmadan AI inteqrasiyasını yoxlanmış sayma.

Saxlanmış demo təhlili yalnız dəyişdirilməmiş nümunə CV-lər üçün verilir və ayrıca işarələnir. Yeni CV üçün hazır hesabat və ya uydurma AI nəticəsi yoxdur.

Rəsmi mənbə: [Claude API açarının qurulması](https://platform.claude.com/docs/en/get-api-key).

## Supabase HR girişi və saxlama

1. İstifadə edəcəyin ayrıca Supabase layihəsini seç.
2. `supabase/migrations/001_workspace.sql` mətnini nəzərdən keçirib həmin layihənin SQL editorunda bir dəfə icra et.
3. Supabase Auth-da HR istifadəçisi yarat və təsdiq et. Bu versiya özbaşına qeydiyyat və e-poçt göndərmir.
4. `.env.local` daxilində `NEXT_PUBLIC_SUPABASE_URL` və `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` doldur; serveri yenidən başlat.
5. HR istifadəçisinin e-poçt/şifrəsi ilə tətbiqə daxil ol.

Hər iki Supabase dəyişəni birlikdə tələb olunur. Supabase qurulanda lokal demo saxlama avtomatik istifadə edilmir. Lokal demo məlumatları Supabase-ə avtomatik köçürülmür. Bu mərhələdə server secret/service-role açarı tələb olunmur; məlumatlar HR-in yoxlanmış sessiyası və RLS ilə işləyir.

Rəsmi mənbə: [Supabase SSR müştərisi](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs).

## Paralel AI işləri

`TEAM_WORKFLOW.md` branch, fayl sahibliyi və ortaq API müqaviləsini müəyyən edir. Yeni AI işi başlamazdan əvvəl onu oxumalıdır. Paketlər və ortaq tiplər inteqrasiya roluna aiddir. Hazır nəticə ayrı branch-dən `main`-ə birləşdirilib birlikdə yoxlanır.

## Yoxlamalar

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- Lokal server açıq olduqda `npm run test:api`

`test:api` hər dəfə ayrıca demo brauzer kukisi ilə yalnız uydurma məlumat yaradır. Əsas iş sahəsini və real Supabase məlumatlarını yoxlamaq üçün nəzərdə tutulmayıb. Lokal `.data` daxilində testə aid ayrıca iş sahəsi qala bilər.

Real Supabase hesabları/RLS və Claude API bağlantısı açarlar qurulandan sonra ayrıca yoxlanmalıdır. Namizəd sınağına aid gələcək yoxlamalar `VALIDATION_PLAN.md` daxilində plan kimi qalır.
