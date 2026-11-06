# SkillProof AI — yoxlama və pilot planı

Tarix: 6 noyabr 2026. Bu sənəddəki yoxlamalar **planlaşdırılıb, icra olunmayıb**. Hazır tətbiq, real AI nəticəsi və keçirilmiş istifadəçi pilotu yoxdur.

## Əsas axın üçün qəbul yoxlamaları

| ID | Yoxlama | Gözlənən nəticə |
| --- | --- | --- |
| V01 | HR vakansiyanı yaradır, bacarıqları redaktə və təsdiq edir | Dəyişiklik yenilənmədən sonra qalır |
| V02 | Dörd uydurma CV ayrıca təhlil olunur | Hər sitat mənbədə var; çatışmayan məlumat uydurulmur |
| V03 | HR sınağı təsdiqləmədən keçid yaratmağa çalışır | Dəvət açılmır; çatışmayan təsdiq göstərilir |
| V04 | Təsdiqli sınaqdan sonra qaralama dəyişdirilir | Əvvəl yaradılmış sessiyanın versiyası dəyişmir |
| V05 | Namizəd başlamazdan əvvəl səhifəni açır | Qaydalar və müddət görünür, vaxt hələ başlamır |
| V06 | Namizəd mərhələləri ardıcıl keçir | Gələcək şərt əvvəlcədən brauzerə və cavab sorğularına verilmir |
| V07 | Cavab yazılır və səhifə yenilənir | Serverin qəbul etdiyi mətn və qalan vaxt qorunur |
| V08 | Köhnə autosave yeni autosave-dən gec çatır | Yeni mətn köhnə sorğu ilə əvəz edilmir |
| V09 | Növbəti mərhələyə keçərkən saxlama alınmır | Mərhələ irəli getmir; cavab və xəta görünür |
| V10 | Brauzer saatı dəyişdirilir | Serverin bitmə vaxtı dəyişmir |
| V11 | Vaxt bitir, brauzer bağlıdır və ya yenilənir | Server son qəbul edilmiş cavabı yekunlaşdırır; əlavə cavabı rədd edir |
| V12 | Yekun göndərmə iki dəfə kliklənir | Bir yekun sessiya və uyğun tək nəticə yaranır |
| V13 | Claude sorğusu alınmır və ya nəticə yararsızdır | Cavablar qalır, aydın xəta və təkrar cəhd var; saxta canlı nəticə görünmür |
| V14 | Başqa HR və başqa namizədin məlumatı soruşulur | Həm server, həm məlumat bazası qaydaları icazəsiz girişi dayandırır |
| V15 | Namizəd keçidi səhv, vaxtı bitmiş və ya ləğv edilmişdir | Sınaq və şəxsi məlumat açılmır |
| V16 | Tab dəyişir və namizəd qayıdır | Ayrılma sayı/müddəti görünür, bacarıq balı avtomatik azalmır |
| V17 | Mətn CV-yə və sınaq cavabına yapışdırılır | CV-də işləyir; yalnız sınaq cavabında nəzərdə tutulan məhdudiyyət tətbiq edilir |
| V18 | Güclü, zəif, boş, əlaqəsiz və manipulyativ cavab daxil edilir | AI planındakı gözləntilər və rubrika yoxlanır |
| V19 | Satış axını bitir, sonra SOC eyni platformada açılır | Peşələr və namizəd məlumatları qarışmır |
| V20 | Hesabat və demo göstərilir | Hər qiymətin sübutu var; demo açıq işarələnir; canlı yoxlama həqiqi statusu göstərir |
| V21 | Kiçik ekran və yalnız klaviatura ilə əsas axın keçilir | Etiketlər, fokus, səhvlər və statuslar oxunur və istifadə olunur |
| V22 | Brauzerə göndərilən məlumat və repoya daxil edilən fayllar yoxlanır | Server açarları və gələcək mərhələ sirrləri sızmır |

## Kodsuz pilot — iki nəfərlik məşq

Bu, hələ keçirilmiş test deyil. Məqsəd tapşırığın aydınlığını və meyarların istifadəsini yoxlamaqdır. Rol bölgüsü: bir nəfər namizəd, digəri fasilitator/qiymətləndirici; ikinci ssenaridə rollar dəyişir.

1. Namizədə yalnız vakansiya, qaydalar, meyarlar və mərhələ 1 verilir; cavab açarı göstərilmir.
2. Saat başlanır. Namizədin verdiyi dəqiqləşdirmə sualları və vaxtı qeyd edilir.
3. Cavab ayrıca saxlanır. Sonra yeni şərt açılır; əvvəlki cavab dəyişdirilmir.
4. Sonra əsaslandırma sualları verilir. Hər mərhələnin vaxtı ayrıca qeyd edilir.
5. Qiymətləndirici hər meyar üçün cavabdan sübut seçir və səviyyə verir.
6. Rollar dəyişdirilərək digər sahə yoxlanır; sonra hər iki nəfər balları və anlaşılmazlıqları müzakirə edir.

İşçi vaxt hipotezi: ilkin mərhələ 6 dəqiqə, yeni şərt 4 dəqiqə, əsaslandırma 3 dəqiqə — cəmi 13 dəqiqə. Bu rəqəm ölçülmüş müddət və hakaton qaydası deyil. Pilotda ehtiyac olarsa dəyişdirilir. Mətni əvvəlcədən görmüş komanda ilə məşq yeni namizədlər üçün müddəti tam təsdiqləmir.

### Pilot qeyd forması

| Sahə | Satış | SOC |
| --- | --- | --- |
| Tarix və iştirakçı rolu | Doldurulmayıb | Doldurulmayıb |
| Mərhələ 1 vaxtı | Ölçülməyib | Ölçülməyib |
| Mərhələ 2 vaxtı | Ölçülməyib | Ölçülməyib |
| Mərhələ 3 vaxtı | Ölçülməyib | Ölçülməyib |
| Aydın olmayan cümlə | Qeyd yoxdur | Qeyd yoxdur |
| Çatışmayan məlumat | Qeyd yoxdur | Qeyd yoxdur |
| Rubrikada fikir ayrılığı | Qeyd yoxdur | Qeyd yoxdur |
| Dəyişiklik və səbəb | Qərar verilməyib | Qərar verilməyib |

## Hazır sayılma qaydası

Kodlaşdırmadan sonra uyğun build/lint və kritik axın yoxlamaları aparılır. Tətbiq sınaqdan keçmədən bu cədvələ uğur yazılmır. Məlumat itkisi, icazəsiz giriş, server vaxtının aşılması və mənbə uydurulması ilə bağlı həll olunmamış xəta nümayişə hazır statusuna mane olur. Əlavə dizayn funksiyaları əsas axının yoxlanmasını gecikdirməməlidir.
