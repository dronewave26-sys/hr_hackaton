# SkillProof AI

CV-dəki bacarıq iddiasını praktik iş nümunəsi ilə müqayisə edən HR tətbiqi üçün hazırlıq paketi.

**Cari mərhələ: ilk işlək HR versiyası.** Üç AI-nin interfeys, server və inteqrasiya işi birləşdirilib. Lokal vakansiya/CV saxlama, mənbəli demo təhlili və sınaq layihəsi işləyir; 68 test və production HTTP axını yoxlanıb. Supabase bağlantısı və iki HR hesabı ilə izolyasiya yoxlanıb; ilk HR versiyası https://hr-hackaton.vercel.app ünvanında yayımlanıb. Claude bağlantısı, namizəd sessiyası/taymeri və yekun praktik hesabat hələ qalır. Hazır bulud quruluşu və giriş üçün [CLOUD_STATUS.md](CLOUD_STATUS.md) oxu.

## Son razılaşdırılmış qərarlar

- Texniki plan: Next.js, TypeScript, Tailwind CSS, Supabase, **Claude API / Anthropic**, GitHub və Vercel.
- Claude istifadəçinin son seçiminə görə ilkin Gemini planını əvəz edir. Əvvəlki kontekst faylı tarixçə kimi qorunub.
- GitHub, Supabase və Vercel hesabları istifadəçi tərəfindən açılıb. Hesabların tətbiqə qoşulması təsdiqlənməyib.
- Nümayiş sahələri: satış və SOC. Bütün namizəd və tapşırıq məlumatları uydurmadır.
- Son qərar HR-də qalır; AI nəticəsi sübutlu ilkin qiymətləndirmədir.

## Lokal alətlər — son yoxlama

| Alət | Yoxlanmış versiya | Status |
| --- | --- | --- |
| Node.js | v26.13.0 | İşləyir |
| npm | 11.20.0 | İşləyir |
| Git | 2.56.0.windows.4 | İstifadəçi səviyyəsində quraşdırıldı, PATH əlavə edildi və əmr yoxlandı |

Git yolu: `C:\Users\ASUS\AppData\Local\Programs\Git\cmd`. Artıq açıq VS Code/terminallar köhnə PATH-i saxlaya bilər; VS Code-u yenidən açmaq lazım ola bilər. Lokal repo və ayrıca `ai/frontend`, `ai/backend` branch-ləri yaradılıb. Uzaq private depo: [dronewave26-sys/hr_hackaton](https://github.com/dronewave26-sys/hr_hackaton).

## Sənədləri bu ardıcıllıqla oxu

| Sənəd | Nə üçün istifadə olunur? |
| --- | --- |
| [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) | Hazır işləyən hissələr, keçən yoxlamalar və real məhdudiyyətlər |
| [SETUP.md](SETUP.md) | Lokal işə salma, Claude/Supabase konfiqurasiyası və yoxlama əmrləri |
| [TEAM_WORKFLOW.md](TEAM_WORKFLOW.md) | Üç AI üçün fayl sahibliyi, API müqaviləsi və birləşdirmə qaydası |
| [PREPARATION.md](PREPARATION.md) | İlkin mühit yoxlaması və hazırlıq siyahısı; sondakı yenilənməni də oxu |
| [OPERATIONS.md](OPERATIONS.md) | Cari hesab statusu, təşkilatçıya hazır mətn, komanda bölgüsü və gözləyən işlər |
| [PRODUCT_BLUEPRINT.md](PRODUCT_BLUEPRINT.md) | Məhsul əhatəsi, ekranlar, mətnlər və istifadəçi axını |
| [DEMO_SCENARIOS.md](DEMO_SCENARIOS.md) | İki vakansiya, dörd CV, mərhələlər, meyarlar və cavab nümunələri |
| [DEMO_REPORT.md](DEMO_REPORT.md) | Sübutları yanaşı göstərən hazırlanmış HR hesabatı |
| [AI_EVALUATION.md](AI_EVALUATION.md) | Claude üçün nəticə tələbləri, mənbə yoxlaması və kalibrasiya halları |
| [TECHNICAL_PLAN.md](TECHNICAL_PLAN.md) | Məlumat obyektləri, giriş matrisi, vaxt/saxlama və konfiqurasiya planı |
| [VALIDATION_PLAN.md](VALIDATION_PLAN.md) | 22 qəbul yoxlaması və iki nəfərlik kodsuz pilot |
| [PRESENTATION.md](PRESENTATION.md) | Qısa izah, 3 dəqiqəlik məşq, altı slayd mətni və sual-cavab |
| [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) | İlkin müzakirənin qorunmuş tarixçəsi; son dəyişikliklər yuxarıdakı sənədlərdədir |

## Tamamlanan və açıq qalan işlər

- [x] Lokal fayllar və alətlərin ilkin vəziyyəti yoxlanıb.
- [x] Çatışmayan Git quraşdırılıb, istifadəçi PATH-i qorunaraq əlavə edilib və versiya yoxlanıb.
- [x] Məhsul və ekran planı hazırlanıb.
- [x] Satış və SOC materialları, rubrika və nümunə hesabat hazırlanıb.
- [x] Claude seçimi sənədlərə işlənib.
- [x] AI nəticə tələbləri və kritik qəbul yoxlamaları hazırlanıb.
- [x] Təqdimat, ehtiyat nümayiş və təşkilatçı sualları hazırlanıb.
- [ ] Təşkilatçı qaydaları yazılı təsdiqlənib.
- [ ] İki nəfərlik pilot keçirilib və sınaq müddəti ölçülüb.
- [ ] Komanda yoldaşının hesab girişləri yoxlanıb.
- [ ] Claude API çıxışı və xərc həddi yoxlanıb; açar lokal konfiqurasiyaya yerləşdirilib.
- [ ] İcazəli vaxtda kodlaşdırma, inteqrasiya, tətbiq yoxlamaları və deploy aparılıb.

Bu işarələr sənədlərin hazır olduğunu göstərir. Tətbiq sınaqlarının və insan iştirakı tələb edən işlərin yerinə yetirildiyi iddia edilmir.
