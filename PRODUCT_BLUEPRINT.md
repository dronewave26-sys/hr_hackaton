# SkillProof AI — məhsul və ekran planı

Tarix: 6 noyabr 2026. Status: icra üçün hazırlanmış plan; tətbiq hələ qurulmayıb.

## Son qərarlar və əvvəlki kontekstlə əlaqə

- İstifadəçi kodlaşdırmanı sonraya saxlayır; bu mərhələ sənəd, ssenari və mühit hazırlığıdır.
- **AI provayderi istifadəçinin son seçiminə görə Claude / Anthropic-dir.** `PROJECT_CONTEXT.md` və `PREPARATION.md` daxilindəki Gemini qeydləri əvvəlki planın tarixçəsidir. Yeni inteqrasiya Claude API ilə planlaşdırılır.
- İstifadəçi GitHub, Supabase və Vercel hesablarını açdığını təsdiqləyib. Layihələrin və bağlantıların hazır olduğu ayrıca təsdiqlənməyib.
- Aşağıdakı əlavə məhsul detalları mövcud konteksti konkretləşdirən işçi təkliflərdir. Pilot və hakaton qaydaları ilə uyğunlaşdırıla bilər.

## Məqsəd və dəyər

HR bir vakansiyanın tələblərini CV-dəki iddialar və namizədin praktik cavabları ilə yanaşı görə bilsin. Məhsulun əsas nəticəsi insanın yoxlaya bildiyi hesabatdır: mənbə ifadəsi, müşahidə olunan iş, meyar üzrə izah və canlı müsahibə sualı.

İlk istifadəçi: namizədlərin ilkin yoxlamasını aparan HR və ya işə qəbul edən rəhbər. İkinci istifadəçi: ayrıca keçidlə qısa sınağı tamamlayan namizəd.

Uğur göstəricisi üçün ilkin hədəf: satış və SOC üzrə eyni tam axının işləməsi, hər qiymətin cavabdakı sübutla yoxlana bilməsi və saxlanan nəticənin yenilənəndən sonra qorunması. Hələ məhsuldarlıq faizi və ya bazar nəticəsi ölçülməyib.

## İlk versiyanın əhatəsi

| Prioritet | Daxil olanlar | Tamamlanma nəticəsi |
| --- | --- | --- |
| P0 — əsas axın | HR girişi, vakansiya, redaktə edilən bacarıqlar, CV mətninin daxil edilməsi və təhlili | HR hansı iddianın haradan gəldiyini görür |
| P0 — praktik yoxlama | HR-in təsdiqlədiyi sınaq və meyarlar, ayrıca namizəd keçidi, üç mərhələ | Namizəd materiala əsaslanan cavab verir |
| P0 — etibarlı nəticə | Saxlama, server vaxtı, məhdud giriş, sübutlu hesabat və müsahibə sualları | Nəticə itmir və aid olmayan istifadəçiyə açılmır |
| P1 — müşahidələr | Sınaq cavabında adi yapışdırma məhdudiyyəti, səhifədən ayrılma müddəti və sayı | Hadisələr bacarıq balından ayrı görünür |
| Sonrakı mərhələ | PDF/DOCX, e-poçt göndərişi, çoxdillilik, əlavə peşələr, geniş analitika, tam ekran | Minimum nümayişdən sonra nəzərdən keçirilir |

Avtomatik işə qəbul/rədd, şəxsi xarakter haqqında nəticə, AI mətn detektoru ilə hökm və tam köçürməzlik vədi məhsul tələbi deyil. Fiziki peşə bacarıqlarının tam təsdiqi iddia edilmir.

## Ekranlar və əsas hərəkətlər

| Ekran | Məzmun | Əsas hərəkət | Boş/xəta vəziyyəti |
| --- | --- | --- | --- |
| HR girişi | Sadə giriş forması | Daxil ol | Yanlış girişdə aydın mesaj; məlumatı itirmədən yenidən cəhd |
| Vakansiyalar | Vəzifə, status, namizəd sayı, son dəyişiklik | Vakansiya yarat | “Hələ vakansiya yoxdur” və yaratma düyməsi |
| Vakansiya redaktəsi | Ad, iş təsviri, tələblər, gündəlik işlər; bacarıq siyahısı | Bacarıqları çıxar, redaktə et, təsdiqlə | Boş təsvir üçün sahənin yanında izah; AI xətasında mövcud mətn qalır |
| Namizəd və CV | Demo ID/ad, CV mətni; tələb → mənbə → yoxlanmalı bacarıq | CV-ni təhlil et | Məlumat yoxdursa açıq qeyd; sitat uydurulmur |
| Sınaq redaktəsi | Üç mərhələ, verilənlər, meyarlar, müddət | Təsdiqlə və keçid yarat | Müddət və meyar yoxdursa təsdiq açılmır |
| Namizəd başlanğıcı | Vəzifə, qaydalar, vaxt, qeydə alınacaq hadisələr | Tanış oldum, sınağa başla | Etibarsız/bitmiş keçid üçün izah |
| Namizəd sınağı | Qalan vaxt, aktiv mərhələ, material, cavab, saxlama statusu | Cavabı saxla və növbəti mərhələyə keç | Saxlama uğursuzdursa xəbərdarlıq; növbəti mərhələyə keçid uğurlu saxlamadan sonra |
| Tamamlanma | Göndərilmə vaxtı və yekun status | Yekun nəticəni təsdiqlə | Vaxt bitibsə serverdəki son qəbul olunmuş cavab yekunlaşır |
| HR hesabatı | CV mənbəyi, praktik sübut, hər meyar, boşluq, suallar, canlı yoxlama statusu | Nəticəni nəzərdən keçir | AI hesabatı alınmayıbsa “hesabat hazırlanmadı”; cavablar qorunur |

### HR ekranının mətn eskizi

Üst hissə: SkillProof AI, aktiv vakansiya, HR hesabı.
Sol menyu: Vakansiyalar → Namizədlər → Sınaq → Hesabat.
Mərkəz: aktiv işin forması və ya sübut cədvəli.
Alt hissə: son saxlama statusu və növbəti əsas hərəkət.

Hesabatın ilk görünüşü üç yanaşı məna daşıyır: **CV-də iddia → cavabda müşahidə → müsahibədə yoxlama**. Kiçik ekranda bu ardıcıllıq şaquli göstərilir.

### Namizəd ekranının mətn eskizi

Üst hissə: vəzifə, mərhələ 1/3, qalan vaxt.
Material bölməsi: yalnız hazırda açılmış məlumat və əvvəlki mərhələlərin verilənləri.
Cavab bölməsi: mətn sahəsi, “Saxlanır / Saxlandı / Saxlanmadı” statusu.
Alt hissə: növbəti mərhələyə keçid və yekun göndəriş təsdiqi.

İşçi davranış: mərhələ tamamlandıqdan sonra əvvəlki cavab oxuna bilir, dəyişdirilmir. Yeni məlumat əvvəlki cavabı səssizcə əvəz etmir. Server cavabı qəbul etmədən növbəti mərhələ açılmır.

## İnterfeys mətnləri və vizual istiqamət

- Dil: Azərbaycan dili. Qısa etiketlər: “Vakansiya yarat”, “CV-ni təhlil et”, “Meyarları təsdiqlə”, “Keçidi kopyala”, “Sınağa başla”, “Yekun göndər”.
- Əsas rəng: tünd göy; vurğu: yaşıl-mavi; fon: açıq neytral. Bunlar işçi dizayn seçimidir, hazır dizayn sistemi deyil.
- Bir ekranda bir əsas hərəkət. Status yalnız rənglə deyil, mətnlə də göstərilir.
- Formada daimi etiket, klaviatura ilə istifadə, oxunaqlı kontrast və görünən fokus nəzərdə tutulur.
- “Bu, AI-nin ilkin qiymətləndirməsidir. Son qərar üçün insan baxışı tələb olunur.”
- “Bu tələb haqqında CV-də məlumat tapılmadı.”
- “Bu bacarıq təqdim olunan cavabda göstərilməyib.”
- “Bağlantı kəsilib. Son uğurlu saxlama: …”
- “Səhifədən ayrılma qeydə alındı. Bu hadisə təkbaşına köçürmə sübutu deyil.”
- “Saxlanmış demo nəticəsi — canlı AI sorğusu deyil.”

## Sınaq həyat dövrü

1. Vakansiya və bacarıqlar qaralamadır; HR təsdiq edir.
2. Sınaq və meyarlar qaralamadır; HR məzmunu və müddəti təsdiq edir.
3. Dəvət yalnız təsdiqli versiyaya bağlanır. Sonrakı dəyişiklik əvvəlki sessiyanın şərtlərini dəyişmir.
4. Namizəd qaydaları görür; başlamadan vaxt işləmir.
5. Server başlanğıc və son vaxtı yazır; mərhələləri ardıcıllıqla açır.
6. Yekun göndəriş və ya vaxtın bitməsi sessiyanı bağlayır; cavablar dəyişdirilmir.
7. AI hesabatı hazırlanır. Uğursuzluq sessiyanı yenidən açmır; hesabat ayrıca təkrar cəhd edilə bilir.
8. HR hesabatı nəzərdən keçirir; canlı yoxlama əvvəl “gözlənilir”, real görüşdən sonra “tamamlanıb” olur.

## Kodlaşdırmaya keçid üçün qəbul sərhədi

Təşkilatçı qaydaları dəqiqləşdirilir; Git və hesab girişləri yoxlanır; API çıxışı lokal qurulmağa hazır olur. İlk texniki addım HR panelidir. Funksiyanın hazır olduğunu yalnız uyğun yoxlama keçdikdən sonra qeyd etmək olar. Bu sənədin mövcudluğu həmin funksiyaların işləməsinə sübut deyil.
