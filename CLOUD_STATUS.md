# Bulud quraşdırılması — 6 noyabr 2026

## İşləyən əlaqələr

- Canlı sayt: https://hr-hackaton.vercel.app
- Vercel layihəsi: `4625/hr-hackaton`, Next.js, Node.js ayarı 24.x, `npm ci`, `npm run build`.
- Yayımlama: production, READY; CLI ilə göndərilib. Deployment ID: `dpl_BsBJZ8mMf6cqg34EkZiHtmxX5hSz`.
- Supabase: `hr-hackaton`, Free plan, Frankfurt; Vercel Marketplace üzərindən qoşulub.
- Supabase layihə ref-i: `blzzawaljeopgyatjsii`.
- `001_workspace.sql` real bazada tətbiq edilib; RLS və üç sahiblik siyasəti yoxlanıb.
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

## Qalan hissələr

- Claude API açarı və model hələ konfiqurasiya olunmayıb; canlı AI sorğusu yoxlanmayıb.
- Namizəd modulu dostun `ai/candidate` işi ilə hazırlanır. Onun ayrıca miqrasiyası gələndə nəzərdən keçirilib tətbiq edilməlidir.
- Praktik cavabların yekun AI hesabatı hələ hazır deyil.
- GitHub-dan avtomatik Vercel deploy bağlantısı qurulmayıb: private repoya qoşulma Vercel tərəfindən rədd edilib. CLI deploy işləyir; növbəti merge-dən sonra yoxlama və yenidən deploy lazımdır. GitHub push-un avtomatik sayt yenilədiyini düşünmə.
- Brauzer üzərindən vizual yoxlama tamamlanmayıb; yuxarıdakı production yoxlamaları real HTTP/API sorğularıdır.

## Sonrakı deploy

Əvvəl testləri və lazım olan miqrasiyanı tamamla, sonra düzgün Vercel layihəsini yoxla:

```sh
vercel project inspect --non-interactive --scope 4625
vercel deploy --prod --yes --scope 4625
```

Yeni kompüterdə Vercel hesabına giriş və `vercel link --yes --scope 4625 --project hr-hackaton` tələb olunur. Env pull mövcud lokal açarların üzərinə yazmasın; əvvəl ayrıca gitignored fayla çək və ehtiyac olan dəyişənləri birləşdir. Hakaton bitəndə demo/test hesablarını və preview/production baza bölgüsünü ayrıca nəzərdən keçir.
