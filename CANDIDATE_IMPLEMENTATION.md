# Namizəd modulunun təhvili

Branch: `ai/candidate`. Başlanğıc: `origin/main` — `9fda62a20b2621a4351ce21e827f18bead880fbd`.
Sonradan `origin/main`-in yalnız bulud statusu sənədlərini yeniləyən `3ea1dbac42368e6ccf2a18cfb7083683056790e1` commit-i fast-forward ilə qəbul edilib. Oradakı HR Supabase yoxlaması yeni namizəd miqrasiyasının yoxlanması deyil.
Lokal qovluq: `C:\Users\User\Documents\hr_hackaton`.

Modul eyni Next.js tətbiqindədir. HR-in təsdiqlədiyi sınaqdan dəyişməz surət götürür; ayrıca namizəd keçidi, qaydalar, üç mərhələ, avtosaxlama və yekunlaşdırma verir. Satış/SOC başlığı və materialı workspace məlumatından gəlir. Namizəd ekranı HR workspace API-sini çağırmır. AI qiymətləndirməsi, avtomatik e-poçt, tab/paste nəzarəti və deploy əlavə edilməyib.

## İnteqrasiya AI-si üçün konkret addımlar

1. PR-ı nəzərdən keçirib birləşdirin. Mövcud HR ekranına aşağıdakı komponenti yerləşdirin. Bu branch HR ekranını dəyişmir.
2. Ümumi `.env.example` və `SETUP.md` sənədlərinə serverdə `SUPABASE_SECRET_KEY` tələbini əlavə edin; dəyəri heç vaxt Git-ə yazmayın. Mövcud `NEXT_PUBLIC_SUPABASE_URL` və `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` saxlanır. Secret/service-role səlahiyyətli açar yalnız serverə verilməlidir.
3. Seçilmiş Supabase layihəsində `001_workspace.sql`-dan sonra `002_candidate_sessions.sql` miqrasiyasını ayrıca nəzərdən keçirib tətbiq edin. Bu iş zamanı uzaq bazada miqrasiya icra edilməyib.
4. İki real HR hesabı ilə RLS/sahiblik, namizəd kukisi ilə HR girişinin rəddi, RPC paralellik və vaxt sərhədi yoxlamalarını keçirin. Canlı Supabase yoxlanmadan istehsalat doğrulaması tamamlanmış sayılmır.
5. CI-yə build-dən sonra `node scripts/candidate-smoke.mjs` əlavə edin; istəyə görə `package.json`-da `test:candidate` skriptini həmin əmrə bağlayın. Mövcud scripts/CI bu branch-də dəyişməyib.
6. HR hesabat modulu nəticələri aşağıdakı HR GET müqaviləsi ilə oxusun. Bal və AI hesabatı bu modulda hesablanmır.
7. 320/390 px mobil və desktop görünüşünü, klaviatura ilə bütün axını və native yekun təsdiq dialoqunu canlı brauzerdə yoxlayın. Bu mühitdə brauzer hostu əlçatan olmadı; DOM testləri vizual yoxlamanı əvəz etmir.

```tsx
import { CandidateInvitationControl } from "@/components/candidate/candidate-invitation-control";

<CandidateInvitationControl
  vacancyId={vacancy.id}
  candidateId={candidate.id}
  workspaceRevision={workspace.revision}
  approved={Boolean(vacancy.assessment?.approvedAt)}
/>
```

HR workspace revision konfliktindən sonra panel son workspace-i yenidən oxumalıdır. Komponent namizəd/vakansiya dəyişəndə əvvəlki keçidi göstərmir. `approved` server təsdiqini əvəz etmir.

## API müqaviləsi

Runtime sxemlərin mənbəyi `src/lib/candidate/contracts.ts`-dir. ID-lər UUID, vaxtlar UTC ISO 8601, mərhələ 1/2/3, cavab həddi 20 000 simvoldur. Boş cavab saxlanıla və yekunlaşdırıla bilər. Bütün özəl cavablar `private, no-store` ilə qaytarılır. Yazılar JSON və uyğun Origin tələb edir.

### HR

`POST /api/candidate-invitations`

```json
{
  "vacancyId": "<uuid>",
  "candidateId": "<uuid>",
  "workspaceRevision": 4,
  "requestId": "<yeni-uuid>"
}
```

```json
{
  "invitationId": "<uuid>",
  "invitationExpiresAt": "2026-11-13T12:00:00.000Z",
  "url": "https://host/candidate/<uuid>#<64-hex-sirr>",
  "replayed": false
}
```

Dəvət sirri 7 gün ərzində sessiya kukisinə mübadilə edilə bilər. `requestId` HR sahibi daxilində unikaldır. Eyni payload təkrarında `url: null, replayed: true` və əvvəlki ID qaytarılır, yeni dəvət yaranmır. Eyni ID fərqli payload ilə rədd edilir. Workspace sonradan dəyişsə də, eyni ilkin sorğunun təkrarı əvvəlki dəvəti tapır. Xam sirr saxlanmadığı üçün cavab itəndə komponent həmin dəvəti açıq hərəkətlə ləğv edib yenisini yaratmağa imkan verir; sirri bərpa etdiyini iddia etmir. Səhifə yenilənməsi komponentin yaddaşındakı keçidi və requestId-ni itirir; keçidi yaradılan anda kopyalayın. Yeni klik yeni dəvət yarada bilər.

`GET /api/candidate-invitations/<id>` yalnız HR sahibinə:

```ts
{
  invitation: {
    snapshotId, vacancyId, candidateId, invitationExpiresAt,
    assessment: { stages, materials, duration, criteria, approvedAt },
    // CandidateSessionView sahələri də daxil edilir:
    invitationId, sessionId, vacancyTitle, status, durationMinutes,
    serverNow, startedAt, expiresAt, completedAt, revision, currentStage,
    materials, unlockedStages: [
      { stage: 1, prompt, acceptedAnswer, savedAt, locked }
    ]
  }
}
```

Hesabat üçün bütün açılmış mərhələlərin qəbul olunmuş cavabları `unlockedStages`-dədir. Açılmamış mərhələlər üzrə cavab yoxdur. Meyarlar və tam dəyişməz tapşırıq yalnız HR DTO-sundakı `assessment`-dədir. Xam sirr, hash, daxili sorğu jurnalı və sessiya tokenləri HR GET-ə daxil edilmir.

`POST /api/candidate-invitations/<id>/revoke`, body `{}`. Eyni əməliyyat təkrar edilə bilər; sonrakı namizəd oxu/yazı/exchange rədd edilir. HR nəticəni oxuya bilir; mövcud cavablar və tamamlanma vaxtı silinmir, görünən status `revoked` olur.

### Namizəd

`POST /api/candidate/exchange`, body `{ invitationId, secret }`. Bu əməliyyat sınağı başlatmır. Sirr SHA-256 hash-i ilə sabit vaxtlı müqayisə edilir. Yeni 256-bit sessiya sirri HttpOnly, SameSite=Strict, HTTPS-də Secure kukidə verilir; path `/api/candidate`, maksimum ömür 7 gündür. Server də tokenin bitmə vaxtını yoxlayır. Son səkkiz exchange sessiyası dəstəklənir; daha köhnəsi etibarsızlaşır.

Keçid sirri URL fragmentindədir; HTTP URL və Referer-ə daxil olmur. Uğurlu exchange-dən sonra ünvan sətrindən silinir. Səhifə metadata-sı və API `Referrer-Policy: no-referrer` istifadə edir. Keçid kimliyin tam təsdiqi deyil.

`GET /api/candidate/session?invitationId=<uuid>` və `POST /api/candidate/session` cavabı `{ session: CandidateSessionView }`:

```ts
{
  invitationId, sessionId, vacancyTitle,
  status: "ready" | "active" | "submitted" | "expired" | "revoked",
  durationMinutes, serverNow, startedAt: string | null,
  expiresAt: string | null, completedAt: string | null,
  revision, currentStage: 1 | 2 | 3 | null,
  materials: string | null,
  unlockedStages: [{ stage, prompt, acceptedAnswer, savedAt, locked }]
}
```

`ready` zamanı material `null`, mərhələlər boşdur. Yalnız başlamadan sonra ümumi material və açılmış mərhələlər gəlir. Gələcək şərtlər HTML/RSC və namizəd JSON-una göndərilmir; CSS ilə gizlətmə yoxdur. İnteqrasiya zamanı HR ümumi material bölməsinə gələcək mərhələnin gizli şərtini yerləşdirməməlidir.

Mutation nümunələri:

```ts
{ type: "start", invitationId, requestId, revision: 0 }
{ type: "save", invitationId, requestId, revision: 1, stage: 1, answer: "..." }
{ type: "advance", invitationId, requestId, revision: 2, stage: 1, answer: "..." }
{ type: "submit", invitationId, requestId, revision: 4, stage: 3, answer: "..." }
```

`advance` yalnız 1/2, `submit` yalnız 3-cü mərhələdə mümkündür. Cavab və keçid birlikdə yazılır. Kilidli mərhələ dəyişmir. Eyni requestId ilə eyni sorğu cari vəziyyəti qaytarır, UI-ni köhnə snapshot-a aparmır; başqa payload 409 verir. Təkrar start müddəti artırmır. Bütün təkrarlarda əvvəlcə sessiya səlahiyyəti yoxlanır.

Bir brauzer kukisi eyni anda bir dəvəti göstərir. İkinci dəvət başqa tabda açılarsa birinci tabın sorğusu `SESSION_MISMATCH` alır; ona ikinci namizədin məlumatı verilmir. Birinci dəvətin tam keçidini açmaq və ya ayrı brauzer profili istifadə etmək lazımdır.

### Xətalar

Format `{ error: string, code: string }`. 400/413/415 — giriş; 401 — sessiya yoxdur/uyğun deyil; 403 — Origin; 404 — obyekt yoxdur və ya HR sahibi deyil; 409 — revision, mərhələ, təsdiq və requestId konflikti; 410 — bitmiş/ləğv edilmiş giriş və ya gec yazı; 429 — exchange həddi; 503 — saxlama/konfiqurasiya. Əsas kodlar: `REVISION_CONFLICT`, `REQUEST_REUSED`, `SESSION_MISMATCH`, `STAGE_LOCKED`, `EXPIRED`, `INVITATION_EXPIRED`, `REVOKED`, `NOT_APPROVED`, `NOT_FOUND`, `RATE_LIMIT`, `CONFIG`, `STORAGE`, `INVALID_INPUT`, `REQUEST_FAILED`.

## Vaxt və paralellik

- Ümumi müddət surətdəki `Assessment.duration`-dan alınır. Start başlama/bitmə vaxtını bir dəfə qoyur. Brauzer `serverNow` və monotonic `performance.now()` ilə görüntünü hesablayır; qərarı server verir.
- Hər namizəd və HR oxu/yazısı vaxtı yoxlayır. Gec yazı rədd ediləndə də son cavablar əsasında `expired` vəziyyəti saxlanır. `completedAt` son deadline-dır. Brauzer bağlı olsa da HR GET düzgün terminal vəziyyəti görür. Cron yoxdur və lazım deyil; fiziki status ilk sonrakı API müraciətində materializasiya olunur. Bazaya birbaşa baxan hesabat işi bu qaydanı keçməməli, HR endpoint-dən istifadə etməlidir.
- Lokal `.data/candidate-sessions.json` eyni prosesin bütün route bundle-ları üçün global kilid növbəsi, müvəqqəti fayl və rename ilə yazılır. Workspace faylına toxunmur. Yalnız loopback, bir server prosesi üçün demo rejimidir; paylaşılan diskdə çox proses üçün nəzərdə tutulmayıb.
- Supabase adapteri database saatını oxuyur, daxili `version` ilə RPC CAS edir, konflikti təzə məlumatla yenidən qiymətləndirir. RPC sətir kilidindən sonra deadline-ı bir də yoxlayır. Dəvət yaradılması owner/request kilidi və workspace revision/təsdiq yoxlaması ilə atomikdir.
- UI bir anda bir mutation göndərir. 900 ms gecikməli saxlama, cavab gələnədək redaktə edilən mətnin qorunması, qeyri-müəyyən şəbəkə nəticəsində eyni sorğunun təkrarı və 409 zamanı server cavabı ilə yerli qaralamanın yanaşı göstərilməsi var. Qaralama brauzer yaddaşındadır; yeniləmədən sonra yalnız serverin qəbul etdiyi cavab bərpa olunur.
- Exchange üçün hər dəvət ID-si üzrə dəqiqədə 20 cəhd. Lokal limit proses yaddaşındadır; Supabase limiti cədvəl/RPC ilə paylaşılandır. Forwarded IP-yə etibar edilmir. Paylaşılan limit üçün miqrasiya mütləqdir; işləməyəndə giriş açılmır. Dəvət ID-si bilinən halda limit həmin dəvətin istifadəsini müvəqqəti ləngidə bilər.
- Supabase dəyişənlərindən biri varsa lokal fallback yoxdur. Server secret və 002 yoxdursa modul 503 verir. SQL cədvəlləri RLS-lidir; anon giriş yoxdur, authenticated HR yalnız öz sətirlərini oxuya bilir, yazı/RPC service-role serverinə məhduddur.

## Yoxlamalar və məhdudiyyətlər

6 noyabr 2026 lokal yoxlamalar:

- `npm ci`: uğurlu, audit 0 zəiflik; package/lockfile dəyişməyib.
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`: keçir; Vitest: 10 fayl, 92 test.
- `npm run test:integration`: mövcud production HR HTTP axını keçir.
- `node scripts/candidate-smoke.mjs`: production build-də Satış və SOC, təmiz namizəd kukiləri, təsdiq/sahiblik, snapshot, start/refresh, gələcək mərhələ qoruması, paralel saxlama, kilidli mərhələ, yekun və ləğv keçir.
- Unit testlər test saatı ilə deadline/terminal keçidlərini, lokal fayl paralelliyini, Supabase adapterinin CAS retry/database saatını, owner filtrlərini və limitin fail-closed davranışını yoxlayır.
- DOM testlər şəbəkə xətası/retry, acknowledgement-dən əvvəl saxlama statusu, sorğu davam edərkən yeni mətn, 409 konflikti, başqa tabın qəbul olunmuş cavabı və HR namizəd dəyişməsini yoxlayır.

**Yoxlanmayıb:** real Supabase bağlantısı, SQL-in real Supabase-də icrası, real iki HR hesabı ilə RLS; canlı brauzerdə mobil/desktop vizual görünüş və tam klaviatura axını. Brauzer idarəetmə hostu “unavailable” qaytardı. DOM və RPC imitasiya testləri bunları yoxlanmış etmir. Real Claude çağırışı bu modula aid deyil. Deploy və main merge edilməyib.

Qəbul meyarları 1–10 və 12 lokal unit/HTTP testlərdə əhatə olunur. Meyar 11-in HR regresiya və DOM hissəsi keçir; mobil/klaviatura vizual hissəsi açıqdır. Meyar 13-ün real lokal HTTP və adapter testləri keçir; canlı Supabase hissəsi açıqdır.

Smoke əmri əvvəl `npm run build` tələb edir. Skript özü loopback production serverini `3193` portunda `LOCAL_DEMO_MODE=true` ilə başladır; bulud dəyişənlərini yalnız həmin prosesdə boşaldır. Port doludursa başqa serverə qoşulmur; `CANDIDATE_TEST_PORT=3194` kimi boş port seçin. Sonda yalnız öz serverini dayandırır, yaratdığı dəvətləri ləğv edir. Ayrı uydurma workspace/cavab qeydləri `.data`-da qalır; mövcud istifadəçi məlumatı silinmir. Unit testlərin müvəqqəti faylları təmizlənir.

Next.js 16.4.5 paketinin route handler/page/cookies təlimatları yoxlanılıb; install gedərkən eyni [route](https://nextjs.org/docs/app/api-reference/file-conventions/route), [page](https://nextjs.org/docs/app/api-reference/file-conventions/page) və [cookies](https://nextjs.org/docs/app/api-reference/functions/cookies) rəsmi sənədləri də oxunub.
