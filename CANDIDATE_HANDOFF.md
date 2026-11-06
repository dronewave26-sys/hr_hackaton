# Codex üçün tapşırıq: SkillProof AI namizəd modulu

Bu sənədi dostunun Codex-inə bütöv göndər və ya repodan oxut. Bu, yeni iş tapşırığıdır; aşağıdakı namizəd funksiyaları hazırda mövcud deyil.

## Məqsəd və mövcud vəziyyət

Eyni Next.js layihəsinin içində namizədin ayrıca keçidlə üç mərhələli praktik sınaq verməsini qur. Ayrı tətbiq və ayrı repo yaratma. HR-in təsdiqlədiyi real sınaqdan istifadə et; Satış/SOC nümunələrini namizəd ekranına hardcode etmə.

Repo: https://github.com/dronewave26-sys/hr_hackaton — private.

Hazır olanlar: Azərbaycan dilində HR paneli, vakansiya/CV saxlama, dörd uydurma demo CV, mənbəli CV təhlili, üç mərhələli sınaq layihəsinin redaktəsi və HR təsdiqi. Namizəd sessiyası, dəvət API-si, server taymeri və praktik cavab hesabatı hələ yoxdur.

Texnologiya: Next.js App Router, TypeScript, React, Zod, Supabase, Vitest. Dəqiq versiyalar üçün package.json və lockfile əsasdır. AI provayderi Claude/Anthropic-dir; bu modulun işləməsi üçün AI çağırışı lazım deyil.

İlk oxunacaq fayllar:

- AGENTS.md, TEAM_WORKFLOW.md, SETUP.md, IMPLEMENTATION_STATUS.md.
- PROJECT_CONTEXT.md tam; PRODUCT_BLUEPRINT.md, TECHNICAL_PLAN.md, VALIDATION_PLAN.md, DEMO_SCENARIOS.md.
- src/lib/domain.ts, src/lib/fixtures.ts, src/lib/server/context.ts, src/lib/server/http.ts, src/lib/server/errors.ts.
- supabase/migrations/001_workspace.sql və mövcud API/test nümunələri.
- Kod yazmazdan əvvəl node_modules/next/dist/docs/ daxilində işə aid Next.js sənədləri.

Köhnə hazırlıq sənədlərindəki “kodlaşdırma başlamayıb” və Gemini qeydləri tarixçədir. İstifadəçi kodlaşdırmaya icazə verib; cari vəziyyət IMPLEMENTATION_STATUS.md-dədir. Bu yeni namizəd işi üçün aşağıdakı fayl bölgüsü TEAM_WORKFLOW.md-dəki ümumi bölgünü konkretləşdirir.

## İşə başlama və Git qaydası

Repo sahibinin səni collaborator kimi əlavə etməsi və dəvəti qəbul etməyin lazımdır. GitHub girişini öz hesabınla et; repo sahibinin şifrəsini/tokenini istəmə.

Yeni kompüterdə:

```sh
git clone https://github.com/dronewave26-sys/hr_hackaton.git
cd hr_hackaton
git fetch origin
git switch -c ai/candidate origin/main
npm ci
npm run dev
```

Repo artıq varsa, əvvəl git status yoxla, mövcud işi qoru və təmiz ayrıca worktree/branch istifadə et. Mövcud branch-i reset etmə. main-ə birbaşa push və force push etmə. Köhnə ai/frontend və ai/backend branch-lərindən başlama; ən son origin/main əsasdır.

## Sənin sahib olduğun fayllar

- src/app/candidate/** — namizəd səhifələri, öz layout-u və CSS Module-ları.
- src/components/candidate/** — namizəd UI-si; HR-ə qoşulacaq ayrıca CandidateInvitationControl komponenti də burada ola bilər.
- src/app/api/candidate/** — yalnız məhdud namizəd sessiyasına aid API-lər.
- src/app/api/candidate-invitations/** — HR-in dəvət yaratması/ləğvi/nəticəni oxuması üçün ayrıca API-lər.
- src/lib/candidate/** — ortaq namizəd tipləri, Zod sxemləri və brauzer üçün API adapteri.
- src/lib/server/candidate/** — dəvət, sessiya, vaxt, saxlama və server xidmətləri; server-only sərhədi qoy.
- supabase/migrations/002_candidate_sessions.sql — yalnız yeni, geriyə uyğun miqrasiya.
- tests/candidate/**/*.test.ts və scripts/candidate-smoke.mjs.
- CANDIDATE_IMPLEMENTATION.md — faktiki API müqaviləsi, konfiqurasiya, yoxlama nəticələri və inteqrasiya qeydləri.

Bu faylları dəyişmə: src/components/workspace-app.tsx, src/app/page.tsx, src/app/layout.tsx, src/app/globals.css, src/app/api/workspace/**, src/app/api/auth/**, src/lib/domain.ts, src/lib/fixtures.ts, src/lib/local-store.ts, mövcud server/context/http/errors faylları, 001 miqrasiyası, package.json, lockfile, CI və ümumi konfiqurasiya.

Mövcud export-ları import etmək olar. Ortaq fayla dəyişiklik lazımdırsa səbəbini və dəqiq tələb olunan dəyişikliyi CANDIDATE_IMPLEMENTATION.md-də yaz; inteqrasiya AI-si tətbiq edəcək. Yeni paketə ehtiyac olmadan mövcud vasitələri istifadə etməyə üstünlük ver. Məcburi asılılıq varsa onu ayrıca bildirməklə digər müstəqil işi davam etdir.

## Qurulacaq istifadəçi axını

1. HR yalnız öz vakansiyasının öz namizədi üçün təsdiqlənmiş sınaqdan dəvət yaradır. Hər üç mərhələ, material, meyarlar, müddət və başlıq dəvət anında dəyişməz surət kimi saxlanır. Sonrakı HR redaktəsi əvvəlki dəvəti/sessiyanı dəyişdirmir.
2. Namizəd məhdud keçidi açır. Vəzifə, ümumi müddət, qaydalar, saxlamanın davranışı və qeydə alınacaq hadisələr görünür. Ayrı HR hesabı tələb edilmir. “Sınağa başla” basılmayınca vaxt başlamır.
3. Server sınağı başladır və ilk mərhələni açır. Ekranda vəzifə, mərhələ 1/3, qalan vaxt, material və mətn cavabı görünür.
4. Mərhələlər: ilkin həll → yeni şərt → əsaslandırma. Sonrakı mərhələ server əvvəlki cavabı qəbul edib kilidlədikdən sonra açılır. Keçilmiş məlumat və cavablar oxuna bilər, dəyişdirilə bilməz.
5. Cavab yazıldıqca gecikdirilmiş avtomatik saxlama olur. “Saxlanır”, “Saxlandı”, “Saxlanmadı” statusları həqiqi server cavabına əsaslanır. Şəbəkə xətasında yazılmış mətn ekranda qalır, təkrar cəhd mümkündür.
6. Yeniləmədən sonra serverdə saxlanmış cavab, aktiv mərhələ və vaxt bərpa olunur. Yalnız brauzerdə qalmış, qəbul olunmamış mətn üçün saxta bərpa vədi vermə.
7. Son mərhələdə “Yekun göndər” təsdiqi var. Göndərilən cavablar kilidlənir, serverin yekun statusu və qəbul vaxtı göstərilir. Namizədə HR-in gizli hesabatı və ya uydurma bal göstərilmir.
8. Səhv, bitmiş və ləğv edilmiş dəvətlər; artıq tamamlanmış sınaq; şəbəkə xətası; revision konflikti; vaxtın bitməsi üçün aydın Azərbaycan dilində ekranlar qur.

## API və inteqrasiya sərhədi

Mövcud GET/POST /api/workspace HR üçündür. Namizəd brauzeri bu API-yə müraciət etməməli və tam Workspace almamalıdır. Mövcud WorkspaceAction union-unu genişləndirmə.

Aşağıdakı marşrutları yeni modulun ilkin müqaviləsi kimi götür; dəqiq request/response Zod sxemlərini src/lib/candidate/contracts.ts-də mərkəzləşdir və CANDIDATE_IMPLEMENTATION.md-də nümunələrlə göstər:

| Marşrut | İcazə və məqsəd |
| --- | --- |
| POST /api/candidate-invitations | HR context-i: vacancyId, candidateId, workspaceRevision, requestId ilə təsdiqli sınaqdan dəvət yarat; invitationId və məhdud keçid qaytar |
| GET /api/candidate-invitations/[id] | Yalnız HR sahibi: dəvət/sessiya statusu, qəbul olunmuş cavablar və vaxtlar; gələcək hesabat modulu bunu oxuyacaq |
| POST /api/candidate-invitations/[id]/revoke | Yalnız HR sahibi: dəvəti ləğv et |
| POST /api/candidate/exchange | Dəvət sirrini yoxla və məhdud HttpOnly sessiya kukisi ver; sınağı başlatma |
| GET /api/candidate/session | Yalnız həmin sessiya: status, serverNow, müddət, startedAt/expiresAt, revision və yalnız artıq açılmış mərhələlər |
| POST /api/candidate/session | type: start, save, advance, submit; requestId və gözlənilən revision ilə atomik əməliyyat; save/advance/submit zamanı müvafiq cavab və mərhələ yoxlanır |

Namizəd səhifəsi /candidate/[invitationId] olsun. Keçidin sirri URL fragmentində daşına bilər; səhifə onu POST exchange ilə serverə ötürüb uğurlu mübadilədən sonra ünvan sətrindən təmizləsin. Sirr server access log-larına, analitikaya və referer-ə düşməməlidir. Xam sirri yalnız yaradılma cavabında qaytar; saxlamada hash istifadə et. Bu dizaynı dəyişsən eyni təhlükəsizlik xüsusiyyətlərini saxla və müqaviləni sənədləşdir.

İctimai DTO-da bütün assessment.stages massivini ötürüb CSS ilə gizlətmək qadağandır. Başlanğıc ekranı gələcək tapşırıqları almır. HR CV-si, CV təhlili, başqa namizədlər, gizli cavab açarı və gələcək mərhələlər heç bir HTML/RSC/JSON cavabında namizədə verilməməlidir.

HR tərəfinə qoşulacaq komponent hazırlasan props belə olsun: vacancyId, candidateId, workspaceRevision, approved. Komponent dəvət yaradır, keçidi kopyalamağı təklif edir və xətanı göstərir. approved yalnız UI rahatlığıdır; server təsdiqi ayrıca yoxlamalıdır. Mövcud HR ekranına komponenti sən yerləşdirmə; inteqrasiya AI-si yerləşdirəcək. Avtomatik e-poçt göndərmə.

## Vaxt, saxlama və giriş qaydaları

- Müddət mövcud Assessment.duration-dan dəqiqə ilə alınır; 13 dəqiqəni hardcode etmə. Bu versiyada üç mərhələ üçün ümumi vaxtdır; ayrıca mərhələ taymerləri qurma.
- startedAt/expiresAt serverdə bir dəfə təyin olunur. Start təkrarı və səhifənin yenilənməsi vaxtı sıfırlamır. Brauzer taymeri yalnız görüntüdür; saat dəyişdirərək vaxt uzatmaq mümkün olmur.
- Hər oxu/yazıda server son vaxtı yoxlayır. Vaxt bitəndə gec cavab qəbul olunmur; son qəbul edilmiş cavablar yekun vəziyyətdir. Brauzer bağlı olanda da bu qayda qüvvədə qalmalıdır. Gecikmiş yazını rədd etməyi və yekun statusu serverdə atomik təmin et; fon yekunlaşdırması lazımdırsa icra mexanizmini və ayrıca konfiqurasiyasını açıq sənədləşdir. İşləməyən cron-u hazır kimi göstərmə.
- Revision/CAS və requestId ilə köhnə autosave, eyni vaxtda iki tab, təkrar start/advance/submit qorunur. Eyni requestId fərqli payload ilə gələndə rədd edilir. Növbəti mərhələyə keçid və cari cavabın saxlanması bir atomik əməliyyatdır.
- Xəta zamanı UI növbəti mərhələyə keçmir; 409 zamanı istifadəçinin mətnini səssizcə əvəz etmə. Həqiqi saxlanmış vəziyyət və lokal qaralama fərqini göstər.
- Dəvətin keçərlilik vaxtı ilə sınağın bitmə vaxtını ayrı saxla; dəvət ləğvi sonrakı giriş və yazıları dayandırsın. Keçid kimliyin tam təsdiqi sayılmır.
- Dəvət yaratmaq üçün mövcud HR context(request), sahiblik və sınaq təsdiqini yoxla; workspaceRevision köhnədirsə 409 qaytar. Namizəd API-si HR kukisi tələb etməyən ayrıca məhdud autentifikasiyadan istifadə etməlidir.
- Bütün yazılarda origin/CSRF, giriş uzunluğu, vəziyyət və icazə yoxlamaları; özəl cavablarda no-store tətbiq et. Sirrləri və CV/cavab mətnlərini loglama.
- Lokal demo üçün ayrıca .data/candidate-sessions.json istifadə et, mövcud workspace faylını dəyişmə. Atomik yazı və eyni prosesdə paralel sorğu kilidləməsi qur. Lokal fayl rejimi yalnız loopback üçündür.
- Supabase qurulubsa səssiz lokal fallback etmə. Yeni cədvəllər/RLS və atomik keçidlər üçün 002 miqrasiyası hazırla; mövcud 001-i dəyişmə. HR öz dəvətlərinə çıxır; anon istifadəçiyə cədvəllərin ümumi oxunması verilmir. Server imtiyazlı açarı lazım olarsa yalnız serverdə istifadə et və tələb olunan dəyişən adını inteqrasiya qeydinə yaz. Açarı çata/Git-ə istəmə, real bazada miqrasiyanı özbaşına icra etmə.

## Dizayn və prioritet

Azərbaycan dili, mobil ekran, klaviatura ilə istifadə, daimi form etiketləri, görünən fokus və oxunaqlı statuslar vacibdir. Namizəd ekranında HR sidebar-ı olmasın. Stil üçün CSS Modules istifadə et; qlobal HR üslubunu dəyişmə.

Əvvəl dəvət → başlama → üç mərhələ → saxlama → yekunlaşdırma tam işləsin. Sonra vaxt qalarsa səhifədən ayrılma sayı/müddəti və əvvəlcədən bildirilən adi paste məhdudiyyəti əlavə et. Bunlar etibarlı köçürmə sübutu deyil; balı avtomatik azaltma. Kamera/mikrofon izləməsi, AI mətn detektoru, yeni giriş provayderi, yeni framework və deploy bu tapşırığa daxil deyil.

## Qəbul yoxlamaları

1. HR təsdiqi olmadan, yanlış sahib və başqa vakansiyanın namizədi ilə dəvət yaratmaq rədd edilir.
2. Satış və SOC üçün ayrı dəvətlər öz başlığını/materialını açır; namizəd və cavablar qarışmır.
3. HR redaktəsi yaradılmış dəvətin sınaq surətini dəyişdirmir.
4. Başlamadan vaxt işləmir; iki start eyni sessiyanı qaytarır; refresh vaxtı artırmır.
5. Gələcək mərhələ endpoint çağırışı/JSON/RSC ilə vaxtından əvvəl alınmır.
6. Autosave, refresh, şəbəkə xətası, köhnə revision və eyni vaxtda iki sorğu məlumat itirmir.
7. Advance uğursuzdursa mərhələ dəyişmir; tamamlanmış cavab redaktə edilmir.
8. Vaxtı keçmiş yazı serverdə rədd edilir; brauzer bağlı olanda da son cavablar və yekun status HR tərəfindən düzgün oxunur.
9. İki submit bir nəticə yaradır; yekundan sonra yazı qəbul edilmir.
10. Səhv/bitmiş/ləğv edilmiş sirr və başqa sessiya ID-si ilə giriş rədd edilir; sirlər və gələcək mərhələlər sızmır.
11. Mobil və klaviatura axını yoxlanır; mövcud HR testləri keçməyə davam edir.

Unit və API testlərini yaz, real lokal HTTP sınağını scripts/candidate-smoke.mjs ilə ayrıca uydurma iş sahəsində keçir. İstifadəçinin mövcud .data faylını sıfırlama. Vitest hazırda tests/**/*.test.ts aşkarlayır; DOM testləri üçün jsdom artıq var.

İcra et: npm run typecheck, npm run lint, npm test, npm run build, npm run test:integration və yeni namizəd smoke yoxlaması. Brauzer əlçatandırsa tam axını da yoxla. Real Supabase yoxlanmayıbsa açıq qeyd et; imitasiya testini real inteqrasiya kimi təqdim etmə.

## Təhvil

İşi ai/candidate branch-ində commit et və push et:

```sh
git push -u origin ai/candidate
```

main-ə pull request aç, özün merge etmə. PR-da işləyən axın, dəyişən fayllar, API tipləri, miqrasiya/konfiqurasiya tələbləri, yoxlama nəticələri və məlum məhdudiyyətlər yazılsın. CANDIDATE_IMPLEMENTATION.md-də HR komponentinin import/props nümunəsini və hesabat modulu üçün cavab oxuma formatını göstər. Açarsız lokal demo sınağı mümkün olmalıdır.

Yekunda branch adı, commit SHA, PR keçidi, test nəticələri və inteqrasiya AI-sinin etməli olduğu konkret dəyişiklikləri göndər. HR panelinə montaj, ümumi env/CI yeniləməsi, final birləşdirmə və AI praktik hesabatı inteqrasiya tərəfinin işidir. Namizəd modulu bitməsi bütün məhsulun bitməsi demək deyil.
