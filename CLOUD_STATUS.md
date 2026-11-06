# Bulud quraşdırılması — 6 noyabr 2026

## İşləyən əlaqələr

- Canlı sayt: https://hr-hackaton.vercel.app
- Vercel layihəsi: `4625/hr-hackaton`, Next.js, Node.js ayarı 24.x, `npm ci`, `npm run build`.
- Yayımlama CLI ilə aparılır. İlk HR deployment-i `dpl_BsBJZ8mMf6cqg34EkZiHtmxX5hSz` idi; namizəd/hesabat daxil olan son deployment aşağıdakı yekun qeyddə göstərilir.
- Supabase: `hr-hackaton`, Free plan, Frankfurt; Vercel Marketplace üzərindən qoşulub.
- Supabase layihə ref-i: `blzzawaljeopgyatjsii`.
- `001_workspace.sql`, `002_candidate_sessions.sql`, `003_practical_reports.sql` real bazada tətbiq edilib; RLS aktivliyi və sahiblik sərhədləri yoxlanıb.
- Supabase dəyişənləri Vercel-in production/preview/development mühitlərinə inteqrasiya tərəfindən əlavə olunub. Bu ilk hakaton quruluşunda eyni baza istifadə edilir; preview testlərini yalnız uydurma məlumatla apar.
- Lokal `.env.local` qurulub. `.env*`, `.data` və Vercel lokal metadatası Git/deploy-a daxil edilmir.

## Giriş

Demo HR hesabı yaradılıb. E-poçt və təsadüfi şifrə yalnız bu kompüterdə `.data/HR_LOGIN.txt` faylındadır. Faylı Git-ə və çata göndərmə. Hesab girişindən sonra Satış və SOC nümunələri real Supabase-də görünür.

İkinci uydurma HR hesabı yalnız məlumat izolyasiyasının yoxlanması üçün yaradılıb. Şifrə və sessiya məlumatları sənədə yazılmır.

## Keçirilən real yoxlamalar

- Lokal tətbiq → Supabase: HR girişi, nümunələrin yüklənməsi və yenidən oxunması.
- Canlı production tətbiqi → Supabase: HR girişi, ayrı Satış/SOC vakansiyaları və davamlı saxlama.
- Başqa real HR sessiyası ilk HR-in workspace məlumatını oxuya bilmir.
- Anonim baza sorğusu workspace məlumatını ala bilmir.
- Miqrasiya bağlantısında Supabase CA sertifikatı ilə TLS sertifikat yoxlaması saxlanılıb.
- Real Supabase-də Satış və SOC dəvəti → üç mərhələ → yekun göndərmə → HR cavabları axını keçir. Başqa HR dəvəti/hesabatı ala bilmir; namizəd kukisi HR girişini açmır.
- Claude Models API ilə `claude-haiku-5-5` ID-si təsdiqlənib; lokal və Vercel development/preview/production mühitlərində qurulub. API açarı secret olaraq saxlanıb (development Vercel config şifrələməsindədir).
- Canlı Claude CV təhlili keçib; sitatlar mənbədə yoxlanıb. Satış praktik hesabatında 5 meyar/12 sitat, SOC-da 5 meyar/13 sitat qəbul edilmiş mərhələ cavablarında yoxlanıb; hesabatlar real Supabase-də saxlanıb. GET və təkrar POST eyni saxlanmış nəticəni verir.

## Qalan hissələr

- Anthropic Console-da komandanın xərc həddi insan tərəfindən nəzərdən keçirilməlidir. Real API açarı sənəddə və Git-də saxlanmır.
- GitHub-dan avtomatik Vercel deploy bağlantısı qurulmayıb: private repoya qoşulma Vercel tərəfindən rədd edilib. CLI deploy işləyir; növbəti merge-dən sonra yoxlama və yenidən deploy lazımdır. GitHub push-un avtomatik sayt yenilədiyini düşünmə.
- Brauzer üzərindən vizual yoxlama tamamlanmayıb; yuxarıdakı production yoxlamaları real HTTP/API sorğularıdır.

## Sonrakı deploy

Əvvəl testləri və lazım olan miqrasiyanı tamamla, sonra düzgün Vercel layihəsini yoxla:

```sh
vercel project inspect --non-interactive --scope 4625
vercel deploy --prod --yes --scope 4625
```

Yeni kompüterdə Vercel hesabına giriş və `vercel link --yes --scope 4625 --project hr-hackaton` tələb olunur. Env pull mövcud lokal açarların üzərinə yazmasın; əvvəl ayrıca gitignored fayla çək və ehtiyac olan dəyişənləri birləşdir. Hakaton bitəndə demo/test hesablarını və preview/production baza bölgüsünü ayrıca nəzərdən keçir.
