# SkillProof AI — ilk HR mərhələsinin nəticəsi

Tarix: 6 noyabr 2026. İstifadəçi kodlaşdırmaya, üç AI ilə paralel işə və `hr_hackaton` adlı private GitHub deposuna icazə verib.

## Birləşdirilən hissələr

| İstiqamət | Nəticə |
| --- | --- |
| İnterfeys | Azərbaycan dilində uyğunlaşan HR paneli, real say göstəriciləri, axtarış/filtr, vakansiya və CV formaları, mənbəli CV təhlili, sınaq layihəsi redaktəsi/təsdiqi, bağlantı və giriş ekranları |
| Server | Supabase HR sessiyasının yoxlanması, RLS üçün miqrasiya, lokal demo saxlama, sorğu ölçü həddi, origin yoxlaması, revision konflikti, Claude sorğusu və sitat yoxlaması |
| İnteqrasiya | Ortaq runtime sxemləri, dörd demo CV, etibarlı lokal saxlama, unit/API testləri, production HTTP yoxlaması, formatlama və GitHub CI |

Branch-lər və fayl sahibliyi `TEAM_WORKFLOW.md`-dədir. Bütün kod `main` üzərində birləşdirilir. İstifadə olunan hesab və uzaq depo: [dronewave26-sys/hr_hackaton](https://github.com/dronewave26-sys/hr_hackaton). Məxfilik private olaraq yoxlanıb; push və GitHub Actions nəticələri ayrıca təsdiqlənməlidir.

## Keçən yoxlamalar

- TypeScript yoxlaması: xətasız.
- ESLint: xətasız və xəbərdarlıqsız.
- Vitest: 8 test faylı, 68 test keçir. Beş DOM testi Satış və SOC üçün ayrı başlıq, CV və tapşırıq materialını, mövcud və yeni yüklənən nümunənin düzgün açılmasını yoxlayır.
- Next.js production build: uğurlu.
- Production serverində real HTTP axını: demo məlumatların təkrar yaratmadan yüklənməsi, sitatların uyğunluğu, yeni vakansiya/CV saxlama, yenidən oxuma, təsdiqin qaralamaya qaytarılması, ayrı brauzer demo sahəsi, yanlış origin və köhnə revision yoxlamaları keçir.
- Paket auditi: 0 zəiflik. İnkişaf alətinin keçid asılılığı üçün override package.json daxilində saxlanılıb və lint/test/build ilə yoxlanıb.

Real HTTP yoxlaması unit testlərdə görünməyən localhost/127.0.0.1 origin uyğunsuzluğunu üzə çıxardı. Serverin brauzerin gördüyü Host-u təhlükəsiz şəkildə yoxlaması düzəldildi və regression testləri əlavə olundu.

## Yoxlanmamış və növbəti mərhələyə qalan hissələr

- Real Claude API sorğusu: açar və model lokal konfiqurasiyada qurulmayıb. Testlərdə provayder cavabları imitasiya olunur.
- Real Supabase layihəsi, HR hesabları və RLS: 001 miqrasiyası tətbiq edilib, iki real uydurma HR hesabı ilə məlumat izolyasiyası yoxlanıb. Lokal və production API axınları keçir; təfərrüat `CLOUD_STATUS.md`-dədir.
- Brauzerdə vizual və qarşılıqlı istifadə yoxlaması: avtomatlaşdırma hostu əlçatan olmadı; native Chrome pəncərəsi kiçildilmiş olduğundan dəstəklənən UI yolu ilə idarə edilə bilmədi. İstifadəçi lokal tətbiqi açıb yoxlaya bilər.
- Bacarıqlar ilk mərhələdə HR tərəfindən daxil edilir; AI ilə avtomatik bacarıq çıxarma sonrakı genişləndirmədir.
- Namizəd keçidi, sınaq sessiyası, server taymeri, mərhələli cavab/avtosaxlama, hadisələr və yekun praktik cavab hesabatı hələ qurulmayıb.
- Tam rubrika səviyyələri və müqayisəli tapşırıq variantları növbəti mərhələyə aiddir.
- İlk HR versiyası https://hr-hackaton.vercel.app ünvanında yayımlanıb. Əvvəlki `VALIDATION_PLAN.md`-dəki bütün gələcək yoxlamalar tamamlanmış sayılmır.

## İndi istifadə

`npm ci`, sonra `npm run dev`. `http://127.0.0.1:3000` ünvanında **Satış nümunəsini aç** və ya **SOC nümunəsini aç** düyməsinə bas. Seçilən nümunə birbaşa açılır; nümunələr yoxdursa əvvəlcə yüklənir. Mövcud nümunələr yenidən yaradılmır. Namizədi seç, **Demo təhlilini göstər** ilə saxlanmış nümunəyə bax. **Sınaq layihəsi** bölməsində mərhələləri redaktə edib saxla/təsdiqlə. Yeni CV üçün canlı təhlil `SETUP.md` üzrə Claude konfiqurasiyasını tələb edir.

Satış və SOC-un eyni məlumat açması barədə istifadəçi bildirişi saxlanmış məlumatlarda və DOM testində təkrarlanmadı. Əvvəlki ortaq yükləmə düyməsi ümumi siyahını saxlayırdı; indi hər nümunənin ayrıca açılış düyməsi var. Brauzer hostu əlçatan olmadığı üçün istifadəçinin konkret brauzer sessiyasında vizual yoxlama tamamlanmayıb.
