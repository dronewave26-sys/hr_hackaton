# SkillProof AI — hakatona hazırlıq

Yoxlama tarixi: 6 noyabr 2026.
Layihə qovluğu: `C:\Users\ASUS\Desktop\hr_hackaton`.
Əsas kontekst: [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).

## Bu mərhələnin sərhədi

Hakaton başlamayıb. Əvvəlcədən yazılmış koddan istifadə qaydası hələ təsdiqlənməyib. Bu mərhələdə yalnız mövcud vəziyyət yoxlanılıb və hazırlıq sənədləri yaradılıb. Tətbiq funksiyaları yazılmayıb, paket quraşdırılmayıb, baza yaradılmayıb və deploy edilməyib. Mövcud kontekst faylı qorunub.

Bu iki yeni Markdown sənədi də hakatondan əvvəl hazırlanmış materialdır. Onların, demo məlumatlarının və AI ilə hazırlanmış məzmunun istifadəsinə icazəni təşkilatçılardan dəqiqləşdirmək lazımdır.

## Hazır olanlar

- Məhsulun məqsədi müəyyən edilib: CV-də iddia edilən bacarığı praktik iş nümunəsi və konkret sübutlarla müqayisə etmək.
- Əsas axın planlaşdırılıb: vakansiya → CV təhlili → HR-in təsdiqlədiyi sınaq → namizəd cavabları → əsaslandırılmış hesabat.
- Sınağın üç mərhələsi razılaşdırılıb: ilkin həll, yeni şərtə uyğunlaşma və əsaslandırma.
- Platforma müxtəlif peşələrə uyğun nəzərdə tutulub; minimum nümayiş sahələri satış və SOC-dur.
- Texnologiya seçimi plan səviyyəsində var: Next.js, TypeScript, Tailwind CSS, Supabase, Gemini API, GitHub və Vercel. Paket versiyaları və Gemini modeli seçilməyib.
- İnsan qərarı, sübuta əsaslanan qiymətləndirmə və demo nəticəsinin ayrıca işarələnməsi prinsipləri müəyyən edilib.
- [DEMO_SCENARIOS.md](DEMO_SCENARIOS.md) daxilində iki vakansiya, dörd uydurma CV, tapşırıqlar, meyarlar və nümunə cavablar hazırlanıb.

## Lokal yoxlamanın nəticəsi

| Yoxlanan hissə | Müşahidə | Nəticə |
| --- | --- | --- |
| Başlanğıc fayllar | Yalnız `PROJECT_CONTEXT.md` mövcud idi | Hazır tətbiq yoxdur |
| `AGENTS.md` | Layihədə və yoxlanmış yuxarı qovluqlarda tapılmadı | Əlavə yerli təlimat aşkar edilmədi |
| Node.js | `node --version` → `v26.13.0` | Quraşdırılıb və işləyir |
| npm | `npm --version` → `11.20.0` | Quraşdırılıb və işləyir |
| Git | `git` əmri tanınmadı; yoxlanmış standart quraşdırma yollarında da tapılmadı | Git-in işlək olduğu təsdiqlənmədi |
| Git deposu | Qovluqda `.git` yoxdur | Bu qovluqda repo yaradılmayıb |
| Tətbiq infrastrukturu | `package.json`, tətbiq qovluqları, konfiqurasiya və testlər yoxdur | Quraşdırma və kodlaşdırma başlanmayıb |

Node.js və npm üçün əlavə quraşdırma hazırda lazım görünmür. Seçiləcək framework versiyası ilə uyğunluq kodlaşdırma mərhələsində yoxlanmalıdır; burada bu uyğunluq sınaqdan keçirilməyib.

Git başqa bir yerdə quraşdırılmış ola bilər, amma bu terminal onu tapa bilmir. Git quraşdırılmayıbsa, Git for Windows quraşdır; quraşdırılıbsa, onun `cmd` qovluğunun PATH-də olmasını yoxla. Sonra terminalı yenidən açıb `git --version` ilə nəticəni təsdiqlə. Bu mərhələdə sistemə dəyişiklik edilməyib.

## Çatışmayanlar

- Əvvəlcədən hazırlığa, AI istifadəsinə və hazır koda dair yazılı təşkilatçı cavabı.
- İşlək Git əmri və komanda üçün paylaşılmış repo.
- Hesabların mövcudluğunun, komanda girişlərinin və xidmət limitlərinin yoxlanması.
- Tətbiq skeleti, HR paneli, CV təhlili, sınaq ekranı və hesabat.
- Supabase giriş sistemi, məlumat bazası, cədvəllər və məlumatlara giriş qaydaları.
- Gemini bağlantısı, struktur yoxlaması və xəta halları.
- Server vaxt limiti, avtomatik saxlama və sınaq hadisələrinin qeydi.
- Başdan sona sınaqlar və işləyən nümayiş. Hazırda build/lint yoxlaması aparılacaq tətbiq yoxdur.
- Sınaq müddətinin pilot nəticələrinə əsasən seçilməsi.
- Hakatonun müddəti, təqdimat vaxtı, qiymətləndirmə meyarları və təhvil tələbləri.

Bu siyahı gələcək icra planıdır; həmin funksiyaları hakatondan əvvəl hazırlamaq üçün göstəriş deyil.

## Açılmalı və ya mövcudluğu yoxlanmalı hesablar

Hesablarının hazır olub-olmadığı lokal fayllardan müəyyən olunmur. Mövcud hesab varsa yenisini açmaq əvəzinə komanda girişini yoxla. Heç bir xidmətə bu hazırlıq zamanı hesab yaradılmayıb və ödənişli plan aktivləşdirilməyib.

| Xidmət | Nə üçün lazımdır | Hazırlıq addımı |
| --- | --- | --- |
| GitHub | Mənbə kodu və iki nəfərin əməkdaşlığı | Hesaba girişi yoxla; repo görünürlüğünü və yaradılma vaxtını təşkilatçılardan soruş |
| Supabase | İstifadəçi girişi və məlumat bazası | Hesabını yoxla; layihə yaradılmasını qaydalar aydınlaşanadək saxla |
| Google hesabı / Google AI Studio | Gemini API-yə çıxış | Hesab və API çıxışının mövcudluğunu öz hesabında yoxla; cari limit və mümkün xərcləri xidmətin panelində dəqiqləşdir |
| Vercel | İcazə verilən mərhələdə yayımlama | Hesabını və komanda girişini yoxla; hazırda deploy etmə |

Əvvəlki söhbətdə Vercel MCP üçün giriş prosesi başladılmışdı, amma uğurla tamamlandığı bu yoxlamada təsdiqlənməyib. MCP bağlantısı tətbiqin deploy edildiyi mənasına gəlmir.

API açarlarını çata yazmaq lazım deyil. İnteqrasiya vaxtı server sirrləri lokal `.env.local` daxilində saxlanmalı, bu fayl Git-dən kənarda qalmalıdır. Gələcək `.env.example` yalnız dəyişən adları və boş nümunələr saxlamalıdır. Bu mərhələdə açar yaradılmayıb və oxunmayıb.

## Təşkilatçılardan dəqiqləşdiriləcək qaydalar

Cavabları yazılı şəkildə saxla; aşağıdakılar hazırda təsdiqlənmiş qayda deyil, suallardır.

1. Hakatondan əvvəl yazılmış koddan istifadə oluna bilərmi? Olarsa, hansı sərhədlərlə və necə bəyan edilməlidir?
2. Bu kontekst sənədi, hazırlıq planı, uydurma CV-lər, tapşırıq ssenariləri və cavab nümunələri əvvəlcədən hazırlana bilərmi?
3. Codex kimi AI kodlaşdırma vasitələri və tətbiq daxilində Gemini istifadəsinə icazə varmı? İstifadə necə açıqlanmalıdır?
4. Hazır şablonlar, UI kitabxanaları və açıq mənbə paketlərindən istifadənin şərtləri nədir?
5. Hesab açmaq, repo yaratmaq, paket quraşdırmaq, baza hazırlamaq və xidmət bağlantılarını sınaqdan keçirmək nə vaxtdan icazəlidir?
6. İşin başlama/bitmə vaxtı, saat qurşağı, komanda ölçüsü və kodun yazılma tarixini sübut etmə tələbi nədir?
7. Təhvil üçün repo, işləyən URL, video, slayd və ya başqa hansı materiallar tələb olunur? Repo açıq olmalıdırmı?
8. Təqdimat və sual-cavab neçə dəqiqədir? Qiymətləndirmə meyarları və çəkiləri nədir?
9. Xarici API və internetdən istifadəyə icazə varmı? İnternet kəsilərsə açıq işarələnmiş saxlanmış demo qəbul edilirmi?
10. Xidmət kreditləri verilirmi? Namizəd məlumatları və AI-yə ötürülən məlumatlar üçün xüsusi qayda varmı?

## Hakaton başlayana qədər hazırlıq siyahısı

- [ ] Yuxarıdakı qaydaları təşkilatçılardan dəqiqləşdir və yazılı cavabı saxla.
- [ ] Git quraşdırılmasını və ya PATH problemini həll et; yeni terminalda versiyanı yoxla.
- [ ] Komandanın hər iki üzvünün lazım olan hesablara daxil ola bildiyini yoxla.
- [ ] Bu sənədlərin hakatondan əvvəl hazırlandığını qeyd et; istifadəsini təşkilatçı cavabına uyğunlaşdır.
- [ ] İcazə daxilində satış və SOC ssenarilərini komanda yoldaşınla kağız üzərində sına.
- [ ] Tapşırıq mətnində çatışmayan məlumat və alternativ əsaslandırılmış həll olub-olmadığını yoxla.
- [ ] Pilotun nəticəsinə əsasən müddət təklifini qeyd et; rəsmi vaxt kimi təqdim etmə.
- [ ] Rolları bölüşdür: bir nəfər ssenari və qiymətləndirmə, digəri gələcək texniki axın və nümayiş yoxlaması üzərində işləsin.
- [ ] Problemi bir cümlə ilə izah etməyə hazırlaş: “CV-dəki iddianı iş nümunəsi ilə müqayisə edib HR-ə sübutlu hesabat veririk.”
- [ ] İnternet, enerji və iki cihazla nümayiş imkanlarını yoxla.

## İcazə verilən başlanğıcdan sonra

Əvvəl mövcud qovluğu yenidən yoxla. Sonra texnologiya uyğunluğunu dəqiqləşdir, layihəni qur və vakansiya/CV daxil edilən HR panelindən başla. Əsas axını məlumat saxlanması ilə hissə-hissə tamamla; Gemini, vaxt və hadisə nəzarətini sonrakı addımlarda qoş. Satış və SOC ssenariləri ilə yoxladıqdan sonra icazəli deploy mərhələsinə keç.

İndiki növbəti addım: təşkilatçılardan əvvəlcədən hazırlığın sərhədlərini təsdiqlətmək və Git-i işlək vəziyyətə gətirməkdir.

## Kodsuz hazırlığın davamı — 6 noyabr 2026

Yuxarıdakı ilkin yoxlama tarixçə kimi saxlanıb. İstifadəçi GitHub, Supabase və Vercel hesablarının açıldığını təsdiqləyib. API üçün **Claude Console / Anthropic** seçib; bu seçim əvvəlki Gemini planını əvəz edir. Hesab mövcudluğu tətbiq bağlantısının yoxlandığı mənasına gəlmir. API açarı istənməyib və oxunmayıb.

Məhsul/ekran planı, texniki plan, AI qiymətləndirmə qaydaları, qəbul yoxlamaları, nümunə HR hesabatı, təqdimat mətni və komanda planı hazırlanıb. Bütün materialların xəritəsi [README.md](README.md) daxilindədir. Tətbiq kodu, SQL, baza, API inteqrasiyası və deploy yaradılmayıb; `PROJECT_CONTEXT.md` və `DEMO_SCENARIOS.md` dəyişdirilməyib.

İnsan iştirakı gözləyən işlər: təşkilatçı cavabı, komanda girişlərinin yoxlanması, kağız üzərində pilot və real müddətin ölçülməsi, Claude hesabında API/xərc yoxlaması. Bu işlərin siyahısı [OPERATIONS.md](OPERATIONS.md) daxilindədir.

### Git üzrə yekun yenilənmə

Git **2.56.0.windows.4** istifadəçi səviyyəsində `C:\Users\ASUS\AppData\Local\Programs\Git` qovluğuna uğurla quraşdırılıb. Quraşdırıcının rəqəmsal imzası yoxlanıb; quraşdırma və sonrakı sazlama uğurla bitib. `cmd` qovluğu mövcud istifadəçi PATH qeydləri qorunmaqla əlavə edilib. Yenilənmiş proses mühitində `git --version` işləyir. Açıq VS Code/terminal köhnə PATH ilə işləyirsə proqramı yenidən aç. Node.js `v26.13.0` və npm `11.20.0` təkrar yoxlanıb.

İlkin “Git tapılmadı” qeydi tarixi müşahidədir; Git artıq çatışmayan alət deyil. Repo və commit yaradılmayıb. Quraşdırma üsulu üçün [Git-in rəsmi Windows səhifəsi](https://git-scm.com/install/windows) və [Microsoft WinGet təlimatı](https://learn.microsoft.com/windows/package-manager/winget/install) yoxlanıb. WinGet vasitəsilə başladılan ilk quraşdırma tamamlanmadan dayandırılıb, imzası yoxlanmış həmin quraşdırıcı ilə istifadəçi qovluğuna quraşdırma tamamlanıb.

### Sənədlərin yekun yoxlaması

11 Markdown sənədinin kodlaşdırılması və lokal keçidləri yoxlanıb. İlkin `PROJECT_CONTEXT.md` və `DEMO_SCENARIOS.md` fayllarının dəyişmədiyi SHA-256 ilə təsdiqlənib. Məhsul, qiymətləndirmə və test sənədlərində planlaşdırılan işlər real icra nəticəsi kimi göstərilmir. Bu yoxlama tətbiq testi deyil.
