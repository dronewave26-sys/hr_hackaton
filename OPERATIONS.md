# SkillProof AI — hesablar, komanda və açıq işlər

Tarix: 6 noyabr 2026. Bu sənəd hazır görülmüş işi, işçi planı və insan iştirakı gözləyən addımları ayırır.

## Hesabların cari vəziyyəti

| Xidmət | Məlum status | Qalan addım |
| --- | --- | --- |
| GitHub | İstifadəçi hesabı açdığını təsdiqləyib | Komanda yoldaşının girişi, repo görünürlüğü və icazəli yaradılma vaxtı |
| Supabase | İstifadəçi hesabı açdığını təsdiqləyib | Layihə və Auth/RLS quruluşu kodlaşdırma mərhələsinə saxlanıb |
| Vercel | İstifadəçi hesabı açdığını təsdiqləyib | Repo bağlantısı və deploy sonra; əvvəl başlanmış MCP girişinin tamamlanması təsdiqlənməyib |
| Claude Console / Anthropic API | İstifadəçi açarı buradan götürəcəyini bildirib | API çıxışı, uyğun model, limit/xərc nəzarəti və lokal konfiqurasiya hələ yoxlanmayıb |

Hesabın açıq olması onun tətbiqə qoşulduğunu bildirmir. Bu iş zamanı hesab yaradılmayıb, ödəniş aktivləşdirilməyib, üzv dəvəti və mesaj göndərilməyib. Claude açarı üçün [rəsmi təlimat](https://platform.claude.com/docs/en/get-api-key) və [Console açarlar səhifəsi](https://platform.claude.com/settings/keys) istifadə olunur. Açarın özünü çata göndərmək lazım deyil.

## Təşkilatçılara göndərməyə hazır mətn

Aşağıdakı mətn qaralamadır; heç kimə göndərilməyib.

> Salam. İki nəfərlik komandamız SkillProof AI adlı, CV təhlilini qısa praktik sınaqla birləşdirən layihə hazırlamağı planlaşdırır. Hakaton başlamadan əvvəl yalnız hazırlıq aparırıq. Zəhmət olmasa bu məqamları yazılı dəqiqləşdirin:
>
> 1. Əvvəlcədən yazılmış kod, başlanğıc şablonu və AI ilə yaradılmış kod istifadəsinə icazə varmı? Hansı formada açıqlanmalıdır?
> 2. Əvvəlcədən hazırlanmış layihə planı, uydurma CV-lər, tapşırıqlar, rubrika və təqdimat mətni istifadə edilə bilərmi?
> 3. Hesab açmaq, Git quraşdırmaq, repo/baza yaratmaq və API bağlantısını sınaqdan keçirmək üçün hansı vaxt məhdudiyyəti var?
> 4. Codex və tətbiq daxilində Claude API istifadəsinə icazə varmı? Xidmət kreditləri və ya xərc limiti varmı?
> 5. Rəsmi başlama/bitmə vaxtı, repo görünürlüğü, təhvil materialları, təqdimat və sual-cavab müddəti nədir?
> 6. Qiymətləndirmə meyarları nədir və internet/API xətasında açıq işarələnmiş saxlanmış demo qəbul edilirmi?
>
> Hələ tətbiq funksiyalarını yazmamışıq və deploy etməmişik. Mövcud materialların hakatondan əvvəl hazırlandığını açıqlaya bilərik. Təşəkkür edirik.

### Cavabları qeyd etmək üçün cədvəl

| Mövzu | Status | Rəsmi cavab, tarix və mənbə |
| --- | --- | --- |
| Hakatonun adı və rəsmi keçid | İstifadəçidən alınmayıb | — |
| Hazır kod və şablon | Məlum deyil | — |
| AI istifadəsi və açıqlama | Məlum deyil | — |
| Bu sənədlər və demo məlumatları | Məlum deyil | — |
| Repo, baza və API sınağının vaxtı | Məlum deyil | — |
| Müddət və təhvil | Məlum deyil | — |
| Təqdimat və meyarlar | Məlum deyil | — |
| Ehtiyat demo və kreditlər | Məlum deyil | — |

## İki nəfər üçün işçi rol bölgüsü

| Rol | Hazırlıqda | Hakaton zamanı | Birgə yoxlama |
| --- | --- | --- | --- |
| İştirakçı A | Ssenari/rubrika, təşkilatçı sualları, problem izahı | AI nəticələrinin məntiqi, HR hesabatı, danışıq | Sübutlar, ədalətli müqayisə və boş cavablar |
| İştirakçı B | Mühit və hesab girişləri, ekran axını | Formalar, saxlama, inteqrasiyalar, ekran nümayişi | Vaxt, yenilənmə və icazəsiz giriş halları |

Adlar və yekun bölgü hələ seçilməyib. Hər iki nəfər sistemi başa düşməli və digərinin nümayişini davam etdirə bilməlidir.

## İcra vaxtının nisbi bölgüsü

Hakatonun rəsmi müddəti bilinmədiyi üçün saat uydurulmur. Aşağıdakı bölgü yalnız işçi plan təklifidir:

- İlk 10%: qaydaları və əhatəni təsdiqlə, mühiti/konfiqurasiyanı qur.
- Növbəti 35%: vakansiya → CV → təsdiqli sınaq → cavab axınını saxlama ilə tamamla.
- Növbəti 25%: Claude nəticələri, struktur/sübut yoxlaması və HR hesabatı.
- Növbəti 15%: kritik yoxlamalar, icazəli deploy və iki sahənin təkrarı.
- Son 15%: xəta düzəlişi, ehtiyat material və təqdimat məşqi.

Əlavə xüsusiyyətlər vaxtı daraldırsa PDF/DOCX, çoxdillilik, tam ekran və əlavə peşələr çıxarılır. Məlumatın qorunması, giriş məhdudiyyəti, insan təsdiqi və demo açıqlaması saxlanır.

## Xərc və resurs qeydi

| Resurs | İndiki məlumat | İcazəli icradan əvvəl yoxlanacaq |
| --- | --- | --- |
| Claude | API sorğusu göndərilməyib; xərc ölçülməyib | Model qiyməti, hesab limiti, maksimum sorğu/çıxış və komandanın razılaşdığı xərc tavanı |
| Supabase | Hesab var; layihə və istifadə yoxlanmayıb | Cari plan, region, saxlama və istifadə limitləri |
| Vercel | Hesab var; tətbiq deploy edilməyib | Cari plan, komanda şərtləri və limitlər |

Pulsuz və ya limitsiz istifadə vədi verilmir. Bu iş zamanı ödənişli xidmət aktivləşdirilməyib. Büdcə və model seçiləndən sonra kiçik nümunə ilə faktiki istifadə ölçülə bilər.

## İnsan iştirakı gözləyən işlər

- [ ] Hakatonun rəsmi adını və keçidini əlavə et; təşkilatçı cavabını al.
- [ ] Komanda yoldaşının hesablarına girişini yoxla; dəvətləri lazım olan vaxt öz hesabından göndər.
- [ ] `VALIDATION_PLAN.md` üzrə kodsuz pilotu keçir və vaxtları qeyd et.
- [ ] Pilotdan sonra sınağın müddətini və rubrikanın aydınlığını təsdiqlə.
- [ ] Claude Console-da API çıxışını və xərc nəzarətini yoxla; açarı yalnız lokal konfiqurasiyaya yerləşdir.
- [ ] Rəsmi təqdimat müddətinə uyğun iki nəfərlik məşq et.
- [ ] Kodlaşdırma və xidmət layihələrinin yaradılması üçün icazəli vaxtı dəqiqləşdir.
- [ ] İlk commitdən əvvəl öz Git adını və uyğun e-poçt seçimini lokal olaraq qur; bu məlumatlar hazırda təyin edilməyib.

Bu addımlar real insan cavabı, hesab girişi və ya keçirilmiş məşq tələb edir. Onların planlaşdırılması tamamlandığı mənasına gəlmir.

## Bu mərhələdə tamamlanan mühit işi

Git 2.56.0.windows.4 istifadəçi qovluğuna quraşdırılıb və adi `git --version` əmri yenilənmiş PATH ilə yoxlanıb. İstifadəçi PATH-inə Git `cmd` qovluğu əlavə edilib. Node.js və npm işləyir. GitHub deposu, uzaq bağlantı və commit yaradılmayıb; açıq tətbiqlərdə Git-in görünməsi üçün VS Code/terminal yenidən açıla bilər.
