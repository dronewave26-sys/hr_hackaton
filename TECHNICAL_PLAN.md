# SkillProof AI — texniki hazırlıq planı

Tarix: 6 noyabr 2026. Bu sənəd arxitektura qərarlarını təsvir edir; kod, SQL, baza və deploy yaradılmayıb.

## Cari seçim

Next.js + TypeScript, Tailwind CSS, Supabase Auth və məlumat bazası, **Claude API (Anthropic)**, GitHub və Vercel. Claude seçimi istifadəçinin son cavabıdır və ilkin Gemini planını əvəz edir. Model adı, SDK və paket versiyaları hələ seçilməyib; icra günü rəsmi uyğunluq məlumatları ilə yoxlanacaq.

## Sorğunun yolu

HR brauzeri vakansiya və CV-ni tətbiqin serverinə göndərir. Server HR girişini və məlumat sahibliyini yoxlayır, Claude-a yalnız iş üçün lazım olan məzmunu ötürür. AI nəticəsi struktur və mənbə baxımından yoxlanır, sonra Supabase-də saxlanaraq HR-ə qaytarılır.

Namizəd brauzeri məhdud sessiya keçidi ilə serverə müraciət edir. Server yalnız cari mərhələni açır, vaxtı və cavabın versiyasını yoxlayır. Namizədin brauzeri HR qeydlərini, cavab açarını və gələcək mərhələni almır.

## Planlaşdırılan məlumat obyektləri

| Obyekt | Vacib məlumat | Əlaqə və qayda |
| --- | --- | --- |
| HR profili | Giriş istifadəçisi, görünən ad | Məlumatların sahibi |
| Vakansiya | Sahibi, başlıq, təsvir, tələblər, status | Yalnız sahibi idarə edir |
| Bacarıq/meyar | Vakansiya, təsvir, səviyyə izahları, çəki | Sınaq təsdiqlənəndə versiyalanır |
| Namizəd | Vakansiya, demo ID/ad, CV mətni | Başqa vakansiyanın namizədinə qarışmır |
| CV təhlili | Tələb, mənbə ifadəsi, müşahidə, boşluq | CV və vakansiya versiyasına bağlıdır |
| Sınaq versiyası | Üç mərhələ, verilənlər, rubrika, müddət, HR təsdiqi | İstifadə edilmiş təsdiqli versiya sabitdir |
| Dəvət | Namizəd, sınaq versiyası, məhdud giriş, keçərlilik | Keçidin xam sirri bazada və loqda açıq saxlanmır |
| Sessiya | Başlama/bitmə vaxtı, cari mərhələ, status | Vaxt və mərhələ server tərəfindən idarə edilir |
| Mərhələ cavabı | Sessiya, mərhələ, mətn, versiya, saxlama vaxtı | Tamamlanmış mərhələ dəyişdirilmir |
| Hadisə | Sessiya, növ, qəbul vaxtı, ayrılma müddəti | Bacarıq qiymətindən ayrıdır; brauzer hadisəsi təsdiqli ittiham deyil |
| Hesabat | Meyarlar, cavab sübutları, səbəblər, boşluqlar, suallar | Yekun sessiya və rubrika versiyasına bağlıdır |
| İnsan baxışı | HR qeydi, canlı yoxlama statusu | AI nəticəsindən ayrılır |

Bu cədvəl verilənlər bazasının yaradıldığını bildirmir.

## Məlumata giriş matrisi

| Məlumat | HR sahibi | Başqa HR | Həmin namizəd | Başqa namizəd |
| --- | --- | --- | --- | --- |
| Vakansiya və bütün namizədlər | İcazəli | Qadağan | Yalnız sınaq üçün vacib hissə | Qadağan |
| CV və təhlil | İcazəli | Qadağan | İlk versiyada HR təhlili açılmır | Qadağan |
| Aktiv sınaq materialı | İcazəli | Qadağan | Yalnız açılmış mərhələlər | Qadağan |
| Cavablar | İcazəli | Qadağan | Yalnız öz sessiyası və icazəli mərhələ | Qadağan |
| Cavab açarı, gələcək mərhələ | İcazəli | Qadağan | Hələ açılmayıbsa qadağan | Qadağan |
| Hesabat və hadisələr | İcazəli | Qadağan | İlk versiyada HR hesabatı açılmır | Qadağan |

İşçi qərar: namizəd üçün ayrıca hesab açılması əvəzinə məhdud keçid istifadə olunsun. Keçid sınaq sirridir; onun paylaşılması namizədin kimliyini sübut etmir. Kimlik və cavabın müəllifliyi qısa canlı yoxlama ilə dəqiqləşdirilir.

Serverdə hər əməliyyatda sessiya və sahiblik yoxlanmalıdır. Supabase-də ayrıca RLS siyasətləri planlaşdırılır. İmtiyazlı server açarından istifadə edilərsə, tətbiqin icazə yoxlamaları yenə lazımdır; açar brauzerə verilmir. Bu sərhəd Supabase-in [rəsmi məlumat təhlükəsizliyi sənədinə](https://supabase.com/docs/guides/database/secure-data) əsaslanır.

## Vaxt, saxlama və təkrar sorğu qaydaları

- Müddət HR təsdiqindən sonra versiyaya bağlanır. Server başlanğıc vaxtından bitmə vaxtını hesablayır.
- Səhifə yenilənəndə serverin vaxtı və qəbul etdiyi son cavab qaytarılır; taymer sıfırlanmır.
- Serverə gecikərək çatan cavab vaxt bitibsə qəbul edilmir. İstifadəçiyə brauzerdəki saxlanmamış mətnlə serverdə qəbul olunmuş mətnin fərqi aydın göstərilir.
- Hər cavabın versiyası var; köhnə saxlama sorğusu daha yeni cavabı əvəz etmir.
- Eyni göndərişin təkrarı ikinci sessiya və ya ikinci yekun nəticə yaratmır.
- Vaxtın bitməsi serverdə icra olunan yekunlaşdırma ilə işləməlidir; yalnız açıq brauzer taymerinə etibar edilmir. Müstəqil server yoxlamasının mexanizmi icrada seçilib sınaqdan keçiriləcək.
- Şəbəkə xətasında saxlama uğurlu kimi göstərilmir. “Saxlandı” yalnız server təsdiqindən sonra yazılır.
- Texniki istisna və əlavə vaxt HR tərəfindən əsaslandırılaraq qeyd edilir; qayıdışla vaxt avtomatik artmır.

## Lokal konfiqurasiya planı

| Gələcək dəyişən adı | Məqsəd | Harada saxlanır |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Claude API-yə çıxış | Yalnız server mühiti |
| `ANTHROPIC_MODEL` | Seçiləcək modelin adı; tətbiq üçün işçi dəyişən adı | Server konfiqurasiyası |
| `NEXT_PUBLIC_SUPABASE_URL` | Layihənin açıq URL-i | Tətbiq konfiqurasiyası |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Layihənin açıq müştəri açarı | Müvafiq RLS ilə istifadə olunur |
| `SUPABASE_SECRET_KEY` | Yalnız lazım olarsa imtiyazlı server işi | Yalnız server mühiti |

Supabase adları tətbiq üçün planlaşdırılmış dəyişən adlarıdır; icrada seçilən SDK ilə uyğunlaşdırılacaq. Hələ `.env` faylı yaradılmayıb. Real açarlar çata, sənədə və Git-ə daxil edilmir. `.env.local` Git-dən kənarda, `.env.example` isə yalnız boş dəyişən adları ilə planlaşdırılır.

Claude açarının idarə olunduğu yer [Claude Console API keys](https://platform.claude.com/settings/keys) səhifəsidir; `ANTHROPIC_API_KEY` adı [rəsmi API təlimatında](https://platform.claude.com/docs/en/get-api-key) göstərilir. Bu mərhələdə açar yaradılmayıb və API sorğusu göndərilməyib.

## Qurma ardıcıllığı — hələ icra edilməyib

1. Qaydalara uyğun başlanğıcı təsdiqlə, mövcud faylları qoru, repo və texnologiya uyğunluğunu hazırla.
2. HR girişi, vakansiya/CV formaları və saxlama ilə başla.
3. HR-in təsdiqlədiyi sınaq versiyası və məhdud namizəd keçidini qur.
4. Mərhələli cavab, server vaxtı və avtomatik saxlama axınını tamamla.
5. Claude nəticələrini yoxlayan inteqrasiyanı və sübutlu hesabatı qoş.
6. Hadisələri bacarıq balından ayrı əlavə et; bütün kritik yoxlamaları apar.
7. Satış və SOC axınlarını yoxla; sonra icazəli deploy və yayımdan sonrakı yoxlama et.

## İcra günü dəqiqləşəcək texniki seçimlər

Paket/model versiyaları, layihə regionu, müddət, dəvət keçərinin uzunluğu, server yekunlaşdırma mexanizmi, sorğu hədləri və saxlanma müddəti. Bunlar hazır qərar və ya işlək funksiya kimi təqdim edilmir.
