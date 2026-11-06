import type { AnalysisContent, Vacancy } from "./domain";

export function createFixtures(): Vacancy[] {
  const createdAt = new Date().toISOString();
  const candidate = (name: string, demoKey: string, cv: string) => ({
    id: crypto.randomUUID(),
    name,
    demoKey,
    cv,
    createdAt,
  });
  return [
    {
      id: crypto.randomUUID(),
      title: "B2B satış məsləhətçisi",
      department: "Satış",
      demoKey: "sales",
      createdAt,
      description:
        "Uydurma DemoSəma Ofis şirkəti üçün kiçik müəssisələrin avadanlıq ehtiyacını öyrənmək, məhsulları müqayisə etmək, büdcə daxilində təklif hazırlamaq və CRM qeydi aparmaq.",
      skills: [
        "Ehtiyacın müəyyənləşdirilməsi",
        "Qiymət hesablaması",
        "Məhsul müqayisəsi",
        "Dəyişən tələbə uyğunlaşma",
        "CRM qeydləri",
      ],
      candidates: [
        candidate(
          "Demo Namizəd Səma-01",
          "sales-a",
          "Demo Namizəd Səma-01\n2024–2026, uydurma DemoDayaq Təchizat, satış məsləhətçisi.\nKorporativ müştərilərin büdcə və istifadə ehtiyacını müəyyənləşdirib məhsul təklifləri hazırlamışam.\nAylıq 18 kommersiya təklifi hazırlamış, qiymətləri elektron cədvəldə müqayisə etmişəm.\nMüştəri tələbi dəyişəndə alternativ paketlər hazırlamışam.\nSatış görüşlərinin nəticələrini CRM-də qeyd etmişəm.\nTəhsil: uydurma Demo Biznes Məktəbi.",
        ),
        candidate(
          "Demo Namizəd Səma-02",
          "sales-b",
          "Demo Namizəd Səma-02\n2024–2026, uydurma DemoKörpü Market, satış əməkdaşı.\nMüştərilərin ehtiyacını öyrənib büdcəyə uyğun məhsul tövsiyə etmişəm.\nMəhsul xüsusiyyətlərini müqayisə etmiş və satış etirazlarını cavablandırmışam.\nDəyişən sifarişlər üçün alternativlər təqdim etmişəm.\nKomandaya satış nəticələri barədə həftəlik şifahi məlumat vermişəm.\nTəhsil: uydurma Demo Ticarət Akademiyası.",
        ),
      ],
      assessment: {
        duration: 13,
        materials:
          "Bütün məlumatlar uydurmadır. 4 eyni model cihaz tələb olunur. Vergilər və çatdırılma qiymətə daxildir. Endirim və RAM artırılması yoxdur.\n\nP1 — DemoLite 14: 650 AZN, 8 GB RAM, 6 saat batareya, 12 ay zəmanət, stok 8, təhvil 2 gün.\nP2 — DemoWork 15: 780 AZN, 16 GB RAM, 5 saat batareya, 24 ay zəmanət, stok 6, təhvil 2 gün.\nP3 — DemoMove 14: 720 AZN, 16 GB RAM, 8 saat batareya, 12 ay zəmanət, stok 5, təhvil 3 gün.",
        stages: [
          "Büdcə 3 200 AZN-dir. 4 eyni model noutbuk, ən azı 16 GB RAM və ən gec 3 günə təhvil lazımdır. Ofisdə elektrik var; batareya minimumu yoxdur. Uyğun məhsulları müqayisə et, seçimini, cəmi və büdcə qalığını göstər. Müştəriyə 3–5 cümləlik təklif yaz.",
          "Büdcə 2 900 AZN oldu. Hər cihaz üçün ən azı 7 saat batareya tələb olunur. Digər şərtlər dəyişmir. Təklifini yenilə və ya əvvəlki seçimin hələ uyğundursa əsaslandır.",
          "Son seçimi ən azı üç rəqəmlə əsaslandır. Digər məhsulların uyğun olmadığını izah et. Zəmanət fərqini və sifarişdən əvvəl təsdiqləyəcəyin məqamları yaz.",
        ],
        criteria: [
          "Ehtiyac və ilkin müqayisə",
          "Hesablamalar",
          "Yeni şərtə uyğunlaşma",
          "Konkret sübut və məhdudiyyət",
          "Müştəri ünsiyyəti",
        ],
      },
    },
    {
      id: crypto.randomUUID(),
      title: "SOC analitiki",
      department: "Kibertəhlükəsizlik",
      demoKey: "soc",
      createdAt,
      description:
        "Uydurma DemoQala Sistemləri üçün autentifikasiya və tətbiq loqlarını nəzərdən keçirmək, hadisələrin ardıcıllığını qurmaq, hipotezləri yeni sübutla yeniləmək və eskalasiya qeydi hazırlamaq.",
      skills: [
        "Loq təhlili",
        "Hadisə xronologiyası",
        "Hipotezin yenilənməsi",
        "Sübutlu eskalasiya",
      ],
      candidates: [
        candidate(
          "Demo Namizəd Qala-01",
          "soc-a",
          "Demo Namizəd Qala-01\n2025–2026, uydurma Demoİz Təhlükəsizlik Laboratoriyası, təcrübəçi.\nTəlim SIEM-ində uğursuz girişləri və sonrakı uğurlu sessiyaları əlaqələndirmişəm.\nİstifadəçi, IP və vaxt göstəriciləri üzrə hadisə xronologiyası hazırlamışam.\nYeni məlumat gələndə ilkin hipotezi yeniləmişəm.\nTəlim insidentlərini sübut sətirləri ilə eskalasiya etmişəm.\nTəhsil: uydurma Demo Rəqəmsal Məktəbi. Təcrübə laboratoriya mühitindədir.",
        ),
        candidate(
          "Demo Namizəd Qala-02",
          "soc-b",
          "Demo Namizəd Qala-02\n2025–2026, uydurma DemoŞəbəkə Təlim Mərkəzi, təcrübəçi.\nTəlim SIEM-ində giriş xəbərdarlıqlarını araşdırmışam.\nIP ünvanlarını, istifadəçi adlarını və uğurlu/uğursuz girişləri müqayisə etmişəm.\nYeni sübutlar əsasında araşdırma nəticələrini yeniləmişəm.\nKomandaya təhlükəsizlik hadisələri barədə qısa məlumat vermişəm.\nTəhsil: uydurma Demo Texnologiya Akademiyası.",
        ),
      ],
      assessment: {
        duration: 13,
        materials:
          "Bütün hadisələr uydurmadır. Vaxt UTC, 6 noyabr 2026. İstifadəçi: demo.analyst. session eyni olduqda sətirlər eyni sessiyaya aiddir.\n\nL1 09:00 login_failed IP=203.0.113.24 count=6 reason=wrong_password\nL2 09:03 login_success IP=203.0.113.24 session=S11 mfa=passed\nL3 09:04 document_read IP=203.0.113.24 session=S11 document=guide-demo",
        stages: [
          "L1–L3 üçün qısa xronologiya qur. İlkin hipotezi, qeyri-müəyyənliyi və prioritet verdiyin üç yoxlamanı yaz. Ələ keçirilmə barədə qəti nəticə mümkündürmü?",
          "İT təsdiqləyir: 203.0.113.24 şirkətin VPN çıxışıdır. İstifadəçi S11-i tanıyır. Yeni loqlar: L4 09:07 login_success IP=198.51.100.88 session=S12 mfa=not_challenged device=new; L5 09:08 export IP=198.51.100.88 session=S12 dataset=demo-customers rows=1200. İxrac üçün tələb olunan rəhbər təsdiqi yoxdur; istifadəçi S12-ni tanımır. Hipotezini yenilə, hansı sessiyaya prioritet verəcəyini və təklif edilən tədbirləri yaz.",
          "Ən azı üç sətir və sessiya ID-si ilə eskalasiya qeydi hazırla. Müşahidə, ehtimal və cavabsız sualları ayır. Əvvəlki qərarından nə dəyişdi?",
        ],
        criteria: [
          "İlkin loq təhlili",
          "Hipotezin yenilənməsi",
          "Sübutların əlaqələndirilməsi",
          "Riskə uyğun reaksiya",
          "Qeyri-müəyyənlik və hesabat",
        ],
      },
    },
  ];
}

export function savedDemoAnalysis(
  vacancy: Vacancy,
  candidateId: string,
): AnalysisContent {
  const person = vacancy.candidates.find((item) => item.id === candidateId);
  if (!person?.demoKey || !vacancy.demoKey)
    throw new Error("Bu CV üçün saxlanmış demo təhlili yoxdur.");
  const original = createFixtures().find(
    (item) => item.demoKey === vacancy.demoKey,
  )!;
  const originalPerson = original.candidates.find(
    (item) => item.demoKey === person.demoKey,
  );
  if (
    person.cv !== originalPerson?.cv ||
    JSON.stringify(vacancy.skills) !== JSON.stringify(original.skills)
  ) {
    throw new Error(
      "Demo təhlili yalnız dəyişdirilməmiş nümunə CV və meyarlar üçündür.",
    );
  }
  const a = person.demoKey.endsWith("-a");
  const quotes =
    vacancy.demoKey === "sales"
      ? a
        ? [
            "Korporativ müştərilərin büdcə və istifadə ehtiyacını müəyyənləşdirib",
            "qiymətləri elektron cədvəldə müqayisə etmişəm",
            "məhsul təklifləri hazırlamışam",
            "Müştəri tələbi dəyişəndə alternativ paketlər hazırlamışam.",
            "Satış görüşlərinin nəticələrini CRM-də qeyd etmişəm.",
          ]
        : [
            "Müştərilərin ehtiyacını öyrənib büdcəyə uyğun məhsul tövsiyə etmişəm.",
            "",
            "Məhsul xüsusiyyətlərini müqayisə etmiş",
            "Dəyişən sifarişlər üçün alternativlər təqdim etmişəm.",
            "",
          ]
      : a
        ? [
            "Təlim SIEM-ində uğursuz girişləri və sonrakı uğurlu sessiyaları əlaqələndirmişəm.",
            "hadisə xronologiyası hazırlamışam",
            "Yeni məlumat gələndə ilkin hipotezi yeniləmişəm.",
            "Təlim insidentlərini sübut sətirləri ilə eskalasiya etmişəm.",
          ]
        : [
            "Təlim SIEM-ində giriş xəbərdarlıqlarını araşdırmışam.",
            "",
            "Yeni sübutlar əsasında araşdırma nəticələrini yeniləmişəm.",
            "Komandaya təhlükəsizlik hadisələri barədə qısa məlumat vermişəm.",
          ];
  return {
    summary:
      "Əvvəlcədən hazırlanmış demo təhlili. CV-dəki iddialar yalnız mənbə məlumatıdır; praktik bacarıq ayrıca yoxlanmalıdır. İşə qəbul qərarı verilmir.",
    items: vacancy.skills.map((skill, index) => ({
      skill,
      quote: quotes[index],
      status: quotes[index] ? "verify" : "missing",
      observation: quotes[index]
        ? "CV-də bu mövzuya aid iddia var. Səviyyə və müstəqil icra praktik tapşırıqla yoxlanmalıdır."
        : "Bu tələb haqqında CV-də konkret məlumat yoxdur. Bu, bacarığın olmadığı demək deyil.",
      question: `${skill} bacarığını bu iş nümunəsində necə tətbiq etdiyini konkret məlumatla izah et.`,
    })),
  };
}
