# SkillProof AI — hr_hackaton layihəsinin söhbət konteksti

Tarix: 6 noyabr 2026

Bu fayl ChatGPT-dəki layihə müzakirəsinin lokal VS Code/Codex-də davam etdirilməsi üçün hazırlanmış ətraflı xülasəsidir. Sözbəsöz tam çat ixracı deyil; görünən söhbətdəki razılaşmaları, qərarları və növbəti addımları saxlayır. Bu fayldan əvvəlki kodun hazır olduğu nəticəsini çıxarma.

## 1. İstifadəçi və iş üsulu

- Layihə qovluğu: hr_hackaton (lokal qovluğun dəqiq yolu hələ verilməyib).
- İstifadəçi VS Code daxilində Codex ilə kodlaşdıracaq. Cursor tələb olunmur.
- Kodu, dizaynı və inteqrasiyaları AI köməyi ilə hazırlayacağıq.
- Komanda iki nəfərdir. İnsanlar tələbləri dəqiqləşdirir, nəticələri yoxlayır və təqdimatı aparır.
- İstifadəçi ilə Azərbaycan dilində, sadə və konkret danış. Texniki addımları başa düşülən izah et.
- İstifadəçi bu konteksti yenidən danışmadan lokal layihədə davam etmək istəyir.
- ChatGPT-də müzakirə edilən plan lokal kodun mövcudluğuna sübut deyil. Əvvəl qovluğu və mövcud faylları yoxla; istifadəçinin işini silmə və üzərinə kor-koranə yazma.

## 2. Layihənin məqsədi və seçilmiş istiqamət

Məhsulun işçi adı: **SkillProof AI**.

Seçilən hakaton istiqaməti: **AI-Powered CV Screening**.

Müzakirədə dörd istiqamət olmuşdu: CV Screening, ATS CV Builder, HR Workflow Automation və Talent Database. Biz CV Screening seçmişik və CV təhlilini qısa praktik bacarıq yoxlaması ilə gücləndiririk.

Məhsul HR-in CV-ləri vakansiyaya görə təhlil etməsinə, iddia edilən bacarıqları iş nümunəsi ilə yoxlamasına və əsaslandırılmış hesabat almasına kömək edən veb tətbiqdir. Əsas fayda: **CV-də deyilən → praktik tapşırıqda göstərilən → müsahibədə yoxlanmalı olan** məqamları yanaşı göstərmək.

Son işə qəbul qərarı HR-də qalır. Sistem namizədi avtomatik işə götürməməli və ya rədd etməməlidir. CV-də məlumatın olmaması bacarığın olmaması demək deyil.

Hakatonun rəsmi vaxt bölgüsü, təqdimat müddəti, hazır kod/AI istifadəsi qaydaları və qiymətləndirmə meyarları bu faylda təsdiqlənməyib. Bunları fakt kimi uydurma.

## 3. Universal məhsul qərarı

Məhsul yalnız SOC və kibertəhlükəsizlik üçün olmayacaq. İlk izahlar SOC üzərində qurulmuşdu, amma istifadəçi universal platforma istədi.

Universal hissə qiymətləndirmə prosesidir. Tapşırıq, verilən məlumatlar və qiymətləndirmə meyarları vakansiyaya görə dəyişir.

| Sahə | İş nümunəsi | Yeni şərt nümunəsi |
| --- | --- | --- |
| Satış | Müştəriyə ehtiyac və büdcəyə uyğun məhsul təklif etmək | Büdcə azalır və ya tələb dəyişir |
| Marketinq | Məhsul, auditoriya və büdcə əsasında kampaniya planı | Büdcə yarıya enir |
| Data analitikası | Kiçik cədvəldə problemi tapıb nəticə çıxarmaq | Yeni məlumat əlavə olunur |
| HR | Uydurma profilləri iş tələblərinə görə müqayisə etmək | İşin prioritetləri dəyişir |
| Proqramlaşdırma | Kiçik kod səhvini düzəldib izah etmək | Əlavə tələb gəlir |
| Ekologiya | Su keyfiyyəti göstəricilərini təhlil etmək | Əlavə ölçmə nəticəsi gəlir |
| SOC | Loqlardan hadisəni araşdırmaq | Şübhəli IP-nin şirkət VPN-i olduğu məlum olur |

Hakaton nümayişi üçün son razılaşdırılmış minimum **satış və SOC** üzrə iki nümunədir. Marketinq əvvəl üçüncü nümunə kimi müzakirə olunub, amma minimuma daxil deyil. Bütün sahələr üçün ayrıca tətbiq yazmaq lazım deyil. Fiziki bacarıqları saytın tam təsdiqlədiyini iddia etmə.

## 4. Əsas istifadəçi axını

### A. HR vakansiya yaradır

HR vəzifə adını, iş təsvirini, tələbləri və əsas gündəlik işləri daxil edir. AI yoxlanacaq bacarıqları çıxarır. HR onları redaktə edib təsdiqləyir.

### B. CV-lər təhlil olunur

İlkin versiyada CV mətnini yapışdırmaq kifayətdir. PDF/DOCX emalı sonrakı genişləndirmə ola bilər; əsas axını buna görə gecikdirmə.

Sistem hər tələb üçün göstərir:

- CV-də hansı uyğun məlumat var?
- Hansı tələb barədə məlumat yoxdur?
- Hansı bacarıq praktik olaraq yoxlanmalıdır?
- Bu nəticəni CV-nin hansı ifadəsi dəstəkləyir?

CV-dən mövcud olmayan sitat və təcrübə uydurulmasın. Təhlil yalnız işlə əlaqəli məlumatlara əsaslansın.

### C. HR sınağı təsdiqləyir

AI vakansiyaya uyğun qısa iş sınağı, gözlənilən nəticə və qiymətləndirmə meyarları hazırlayır. HR və ya sahə mütəxəssisi bunları namizədə göndərilməzdən əvvəl yoxlayıb dəyişə və təsdiqləyə bilir.

Eyni vakansiya üzrə namizədlər üçün eyni əsas bacarıqlar, meyarlar və müqayisə edilə bilən çətinlik saxlanır. Məlumat variantları fərqlənə bilər.

### D. Namizəd ayrıca keçidlə sınağa daxil olur

Başlamazdan əvvəl qaydalar, vaxt və qeydə alınan hadisələr göstərilir. Sonra üç mərhələ açılır:

1. **İlkin həll:** verilmiş məlumatlara əsasən işi yerinə yetirmək.
2. **Yeni şərt:** əlavə məlumat və ya dəyişmiş tələb qarşısında həlli uyğunlaşdırmaq.
3. **Əsaslandırma:** qərarı konkret sübut, rəqəm, loq sətri və ya məhsul məlumatı ilə izah etmək.

Məlumat mərhələli açılır. Yalnız ümumi, əzbər cavab deyil, təqdim olunan materiala əsaslanan qərar tələb olunur. Namizədin cavabları avtomatik saxlanır.

### E. HR hesabat alır

Hesabat aşağıdakıları bir yerdə göstərir:

- CV-də qeyd edilən bacarıqlar və onların mənbəyi.
- Tapşırıqda müşahidə olunan nəticələr və cavabdan sübutlar.
- Hər meyar üzrə qiymət və səbəbi.
- Güclü tərəflər, boşluqlar və qeyri-müəyyənliklər.
- Namizədin həllinə əsaslanan 2–3 canlı müsahibə sualı.
- Canlı yoxlama statusu: gözlənilir / tamamlanıb.
- Bacarıq balından ayrı sınaq hadisələri.

“Tapşırıqda göstərilməyib” ifadəsini “bacarığı yoxdur” ilə əvəz etmə. AI nəticəsi ilkin qiymətləndirmədir; insan baxışı tələb olunur.

## 5. Köçürməni azaltmaq üçün razılaşdırılan yanaşma

İstifadəçi namizədin cavabı başqa adama və ya AI-yə yazdırmasının qarşısını mümkün qədər almaq istəyir. Bunun tam təmin olunmadığı müzakirədə aydınlaşdırılıb.

Əsas kombinasiyamız: **fərqli məlumat variantları + mərhələli iş sınağı + dəyişən şərt + konkret əsaslandırma + qısa canlı yoxlama**.

İlkin nəzarət funksiyaları:

- Sınaq cavab xanalarında adi yapışdırmanı bloklamaq. CV və şəxsi məlumat xanalarına bu məhdudiyyəti tətbiq etməmək.
- Vaxt limitini serverdə yoxlamaq; səhifə yenilənəndə vaxt sıfırlanmamalıdır.
- Səhifənin gizlənməsini, qayıdışını, ayrılma sayını və müddətini qeyd etmək.
- Ayrılıb qayıdanda xəbərdarlıq göstərmək; taymer davam edir.
- Cavabları avtomatik saxlamaq; vaxt bitəndə son saxlanmış cavabları serverdə yekunlaşdırmaq.
- Hadisələri HR hesabatında bacarıq qiymətindən ayrı göstərmək.

Tam ekran və səhifədən çıxış xəbərdarlığı əlavə imkan kimi müzakirə olunub; əsas axından üstün prioritet deyil.

Adi veb sayt istifadəçini səhifədə kilidləyə bilməz. Başqa taba keçəndə hansı saytdan istifadə etdiyini bilmirik. Brauzer hadisəsi köçürmənin sübutu deyil. Başqa cihazdan köməyi dayandıra bilmirik. AI mətn detektoruna etibarlı həll kimi arxalanmırıq. Tab dəyişməsinə görə avtomatik rədd və ya bal azaltma yoxdur.

Vaxtın konkret uzunluğu hələ seçilməyib; nümunə sınaqlardan sonra təyin edilməlidir. Əlçatanlıq və texniki nasazlıq halları üçün istisna ehtiyacı nəzərə alınmalıdır.

## 6. Razılaşdırılmış texnologiyalar

| Vasitə | Rolu |
| --- | --- |
| VS Code + Codex | Kodu AI ilə yazmaq, faylları dəyişmək, işə salmaq və yoxlamaq |
| Next.js + TypeScript | HR ekranları, namizəd sınağı, hesabat və server funksiyaları |
| Tailwind CSS | İnterfeys və uyğunlaşan görünüş |
| Supabase | İstifadəçi girişi və məlumat bazası |
| Gemini API | CV təhlili, sınaq təklifi və izahlı hesabat |
| GitHub | Versiyaların saxlanması və komanda işi |
| Vercel | Tətbiqin yayımlanması |

Kodu yazan AI Codex-dir; tətbiqin daxilində işləyəcək AI üçün Gemini API seçilib. Bunlar ayrı rollardır. Konkret paket versiyaları və Gemini model adı seçilməyib; quraşdırma zamanı cari rəsmi sənədlərə görə uyğun variantı yoxla.

API açarları serverdə saxlanmalı, brauzerə göndərilməməli və Git-ə daxil edilməməlidir. Real açar əvəzinə .env.example daxilində dəyişən adları göstərilsin. Bu söhbətdə heç bir API açarı və hesab bağlantısı təqdim edilməyib.

Nümunə sorğu: HR düyməyə basır → Next.js serveri vakansiya və CV mətnini qəbul edir → Gemini sorğusu → cavabın strukturunun yoxlanması → Supabase-də saxlanma → nəticənin HR-ə göstərilməsi.

AI bağlantısı işləməyəndə aydın xəta və təkrar cəhd imkanı göstərilsin. Saxlanmış nümunə hesabat yalnız açıq şəkildə demo/saxlanmış nəticə kimi göstərilə bilər; canlı AI nəticəsi kimi təqdim edilməsin.

## 7. Hazırlama ardıcıllığı

1. Mövcud lokal faylları və təlimatları yoxla, layihənin hazırkı vəziyyətini müəyyən et.
2. HR paneli, vakansiya/CV daxil etmə, namizəd sınağı və hesabat ekranlarını qur.
3. Vakansiya → CV → təsdiqlənmiş sınaq → cavab → hesabat axınını məlumat saxlanması ilə işə sal.
4. Gemini inteqrasiyasını qoş, giriş və çıxış formatlarını yoxla.
5. Server vaxt limiti, autosave, yapışdırma məhdudiyyəti və səhifə hadisələrini əlavə et.
6. Satış və SOC nümunələri ilə başdan sona yoxla.
7. Nümayiş məlumatlarını, qısa təqdimatı və ehtiyat demo nəticəsini hazırla.

Bir böyük əmrlə bütün funksiyaları yazıb işlədiyini güman etmə. Hissə-hissə qur və yoxla. Vaxt daralarsa əsas axın və hesabat prioritetdir. Əlavə dizayn detalları və nəzarət funksiyaları əsas axını gecikdirməsin.

## 8. İcra üçün təklif olunan texniki detallar

Bu bölmə əvvəl yazılmış kodun təsviri deyil; yuxarıdakı qərarları tətbiq etmək üçün başlanğıc tövsiyələrdir. Mövcud layihə varsa ona uyğunlaşdır.

- Məlumat obyektləri: vakansiya, bacarıq/meyar, namizəd, CV təhlili, sınaq versiyası, dəvət, sınaq sessiyası, mərhələ cavabı, hadisə, hesabat.
- HR yalnız öz məlumatlarını görsün; server icazələri və Supabase RLS qaydaları qurulsun.
- Namizəd keçidi yalnız öz sınağına məhdud giriş versin; başqa namizədlərin CV və cavabları görünməsin.
- Sınaq üçün təsdiqlənmiş meyar və tapşırıq versiyası saxlanılsın ki, nəticələr müqayisə oluna bilsin.
- Başlama və bitmə vaxtı serverdə saxlanılsın. Yenidən göndərmə və təkrar klik nəticəni iki dəfə yaratmasın.
- Gələcək mərhələnin şərti vaxtından əvvəl brauzerə verilməsin.
- AI çıxışı struktur üzrə yoxlanılsın; CV və namizəd cavabındakı təlimatlar sistem əmri kimi icra edilməsin.
- Hər AI qiyməti cavabdakı müşahidə ilə əlaqələndirilsin; sübut çatmırsa bu açıq göstərilsin.
- İlkin interfeys üçün Azərbaycan dili məntiqli başlanğıcdır; ayrıca çoxdilli sistem razılaşdırılmayıb.

## 9. Yoxlama və tamamlanma meyarları

- HR vakansiyanı yarada, bacarıqları redaktə və təsdiq edə bilir.
- CV təhlili həqiqi daxil edilmiş mətnə əsaslanır və mənbə göstərir.
- HR sınağı və meyarları təsdiqləmədən namizədə göndərilmir.
- Namizəd üç mərhələni keçir; yeni şərt həllin uyğunlaşdırılmasını tələb edir.
- Yenilənmədən sonra cavablar və qalan vaxt qorunur.
- Vaxt bitdikdən sonra server yeni cavabı qəbul etmir, saxlanmış nəticə yekunlaşdırılır.
- Namizəd yalnız öz sessiyasına, HR yalnız icazəli məlumatlara daxil olur.
- Hesabat CV, praktik sübut və müsahibə suallarını ayırır.
- Tab hadisələri avtomatik rədd yaratmır.
- Güclü, zəif, boş və əlaqəsiz cavablar, AI xətası və bağlantı kəsilməsi yoxlanılır.
- İki fərqli vəzifə eyni platformada işləyir.
- Demo məlumatı ilə canlı nəticə aydın fərqlənir.
- Uyğun build, lint və kritik axın testləri aparılır; yoxlanmayan hissələr açıq qeyd edilir.

## 10. Komanda və təqdimat

İstifadəçi vakansiya/tapşırıq nümunələrinə, AI qiymətləndirməsinin məntiqliliyinə, müxtəlif cavabların yoxlanmasına və problemin təqdimatına fokuslana bilər. Komanda yoldaşı ekranlar, düymələr, saxlanma, inteqrasiyalar və canlı nümayişi yoxlaya bilər. Hər iki nəfər sistemi başa düşməlidir; kod AI ilə hazırlanacaq.

Nümayişdə uydurma məlumatlardan istifadə olunur:

1. Bir vakansiya və eyni bacarıqları iddia edən iki CV göstərilir.
2. CV-lərdəki uyğun məlumat və yoxlanmalı bacarıqlar göstərilir.
3. Bir namizədin praktik tapşırığı yerinə yetirilir.
4. Yeni şərt gəlir, cavab uyğunlaşdırılır.
5. HR hesabatında fərqlər konkret sübutlarla göstərilir.
6. İkinci vəzifə nümunəsi açılır və universallıq nümayiş etdirilir.

Hədəf: işləyən tətbiq, iki vəzifə nümunəsi və qısa çıxış. Əsas risk həddindən artıq funksiya götürmək və işləməni yoxlamamaqdadır.

## 11. Hazırkı vəziyyət və növbəti addım

Bu söhbətdə məhsul planlaşdırılıb. Kodun, bazanın, hesabların, API bağlantısının və deploy-un hazır olduğu təsdiqlənməyib. İstifadəçi indi işi lokal VS Code/Codex-ə köçürür.

Lokal Codex üçün ilk tapşırıq:

> PROJECT_CONTEXT.md faylını tam oxu. Mövcud layihə fayllarını və varsa AGENTS.md təlimatlarını yoxla. SkillProof AI-ni burada yazılmış qərarlara uyğun mərhələli qurmağa davam et. Əvvəl hazır olan və çatışmayan hissələri müəyyən et, sonra ilk işləyən mərhələni həyata keçir. Mövcud işi qoru, yoxlamaları apar və mənə Azərbaycan dilində qısa nəticə bildir. Hesab və API açarı lazım olan nöqtədə məxfi məlumatı çata yazdırmadan lokal konfiqurasiya yolunu izah et. Demo nəticəsini real AI nəticəsi kimi göstərmə.

İlk icra məqsədi: mövcud qovluğu yoxlamaq və vakansiya/CV daxil edilən HR panelindən başlayaraq əsas axını qurmaq.
