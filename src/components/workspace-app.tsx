"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Database,
  FileSearch,
  FileText,
  Layers3,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type {
  AppConfig,
  Assessment,
  Candidate,
  Vacancy,
  Workspace,
  WorkspaceAction,
} from "@/lib/domain";

type View = "overview" | "candidates" | "analyses" | "settings";
type ActionInput = WorkspaceAction extends infer A
  ? A extends { revision: number }
    ? Omit<A, "revision">
    : never
  : never;
type ResponseData = {
  workspace?: Workspace;
  config?: AppConfig;
  error?: string;
};
type Action = (action: ActionInput) => Promise<Workspace | null>;
const date = (value: string) =>
  new Intl.DateTimeFormat("az-AZ", { day: "numeric", month: "short" }).format(
    new Date(value),
  );
const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("");
async function fetchWorkspace(signal?: AbortSignal) {
  const response = await fetch("/api/workspace", { cache: "no-store", signal });
  const data: ResponseData = await response.json();
  return { data, status: response.status, ok: response.ok };
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand-symbol">
        <Layers3 size={24} strokeWidth={2.3} />
      </span>
      <span>
        SkillProof<span className="brand-ai">AI</span>
      </span>
    </div>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "blue";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Modal({
  title,
  description,
  children,
  onClose,
  busy,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
  busy: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onClose();
      }}
    >
      <div className="modal-heading">
        <div>
          <p className="eyebrow">İŞ MƏKANI</p>
          <h2 id="modal-title">{title}</h2>
          <p>{description}</p>
        </div>
        <button
          className="icon-button"
          aria-label="Pəncərəni bağla"
          disabled={busy}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function WorkspaceApp() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [view, setView] = useState<View>("overview");
  const [vacancyId, setVacancyId] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [modal, setModal] = useState<"vacancy" | "candidate" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loginRequired, setLoginRequired] = useState(false);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const { data, status, ok } = await fetchWorkspace(signal);
      if (status === 401) {
        setLoginRequired(true);
        return;
      }
      if (!ok || !data.workspace || !data.config)
        throw new Error(data.error || "Məlumatlar yüklənmədi.");
      setWorkspace(data.workspace);
      setConfig(data.config);
      setLoginRequired(false);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError"))
        setError(err instanceof Error ? err.message : "Bağlantı alınmadı.");
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void fetchWorkspace(controller.signal)
      .then(({ data, status, ok }) => {
        if (status === 401) {
          setLoginRequired(true);
          return;
        }
        if (!ok || !data.workspace || !data.config)
          throw new Error(data.error || "Məlumatlar yüklənmədi.");
        setWorkspace(data.workspace);
        setConfig(data.config);
        setLoginRequired(false);
      })
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === "AbortError"))
          setError(err instanceof Error ? err.message : "Bağlantı alınmadı.");
      });
    return () => controller.abort();
  }, []);

  const act: Action = async (action) => {
    if (!workspace || busy) return null;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...action, revision: workspace.revision }),
      });
      const data: ResponseData = await response.json();
      if (response.status === 401) setLoginRequired(true);
      if (response.status === 409) await load();
      if (!response.ok || !data.workspace || !data.config)
        throw new Error(data.error || "Əməliyyat alınmadı.");
      setWorkspace(data.workspace);
      setConfig(data.config);
      setNotice(
        action.type === "seed"
          ? "Satış və SOC demo nümunələri hazırdır. Bütün məlumatlar uydurmadır."
          : "Dəyişikliklər saxlanıldı.",
      );
      return data.workspace;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Bağlantı alınmadı. Yenidən cəhd edin.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  };
  const navigate = (next: View) => {
    setView(next);
    setVacancyId(null);
    setCandidateId(null);
    setError("");
    setNotice("");
  };
  const openVacancy = (id: string, person?: string) => {
    setVacancyId(id);
    setCandidateId(person ?? null);
    setView("overview");
    setError("");
  };
  const selected = workspace?.vacancies.find(
    (vacancy) => vacancy.id === vacancyId,
  );
  const allCandidates =
    workspace?.vacancies.flatMap((vacancy) =>
      vacancy.candidates.map((candidate) => ({ vacancy, candidate })),
    ) ?? [];
  const analysed = allCandidates.filter(({ candidate }) => candidate.analysis);
  const approved =
    workspace?.vacancies.filter((vacancy) => vacancy.assessment?.approvedAt)
      .length ?? 0;

  if (loginRequired)
    return (
      <Login
        onSuccess={() => {
          setError("");
          void load();
        }}
      />
    );
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Əsas məzmuna keç
      </a>
      <aside className="sidebar">
        <Brand />
        <div className="workspace-label">
          <span className="workspace-icon">SP</span>
          <div>
            <strong>HR iş məkanı</strong>
            <span>SkillProof komandası</span>
          </div>
          <span className="workspace-dot" />
        </div>
        <p className="nav-label">İDARƏETMƏ</p>
        <nav aria-label="Əsas menyu">
          {(
            [
              {
                id: "overview",
                label: "Vakansiyalar",
                icon: LayoutDashboard,
                count: workspace?.vacancies.length,
              },
              {
                id: "candidates",
                label: "Namizədlər",
                icon: Users,
                count: allCandidates.length,
              },
              {
                id: "analyses",
                label: "CV təhlilləri",
                icon: FileSearch,
                count: analysed.length,
              },
              { id: "settings", label: "Bağlantılar", icon: Settings2 },
            ] as { id: View; label: string; icon: LucideIcon; count?: number }[]
          ).map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              className={`nav-item ${view === id ? "active" : ""}`}
              onClick={() => navigate(id)}
              aria-current={view === id ? "page" : undefined}
            >
              <Icon size={20} />
              <span>{label}</span>
              {count !== undefined ? (
                <span className="nav-count">{count}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <ShieldCheck size={22} />
          <strong>Qərarın arxasında sübut olsun.</strong>
          <p>
            AI ilkin qiymətləndirir.
            <br />
            Son qərarı insan verir.
          </p>
          <span>İnsan nəzarəti ilə</span>
        </div>
        <div className="sidebar-bottom">
          <span className="avatar avatar-sidebar">HR</span>
          <div>
            <strong>{config?.account?.split("@")[0] || "HR komandası"}</strong>
            <span>
              {config?.storage === "supabase"
                ? "Təsdiqlənmiş hesab"
                : "Lokal demo məkanı"}
            </span>
          </div>
          {config?.storage === "supabase" ? (
            <button
              aria-label="Hesabdan çıx"
              className="icon-button"
              onClick={async () => {
                const response = await fetch("/api/auth", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ type: "logout" }),
                });
                if (response.ok) setLoginRequired(true);
                else setError("Hesabdan çıxış alınmadı.");
              }}
            >
              <LogOut size={17} />
            </button>
          ) : null}
        </div>
      </aside>
      <div className="workspace-shell">
        <header className="topbar">
          <div className="breadcrumb">
            İş məkanı <ChevronRight size={14} />
            <strong>
              {selected
                ? selected.title
                : view === "overview"
                  ? "Vakansiyalar"
                  : view === "candidates"
                    ? "Namizədlər"
                    : view === "analyses"
                      ? "CV təhlilləri"
                      : "Bağlantılar"}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="environment">
              <span />
              {config?.storage === "supabase" ? "Supabase" : "Lokal demo"}
            </span>
            <span className="topbar-divider" />
            <span className="avatar avatar-top">HR</span>
          </div>
        </header>
        <main id="main" className="main-content">
          <div className="feedback-region" aria-live="polite">
            {error ? (
              <div className="alert alert-error" role="alert">
                <CircleHelp size={18} />
                <span>{error}</span>
                <button
                  className="icon-button"
                  onClick={() => setError("")}
                  aria-label="Xətanı bağla"
                >
                  <X size={16} />
                </button>
              </div>
            ) : null}
            {notice ? (
              <div className="alert alert-success">
                <CheckCircle2 size={18} />
                <span>{notice}</span>
                <button
                  className="icon-button"
                  onClick={() => setNotice("")}
                  aria-label="Bildirişi bağla"
                >
                  <X size={16} />
                </button>
              </div>
            ) : null}
          </div>
          {!workspace || !config ? (
            <div className="loading-state">
              <LoaderCircle className="spin" size={30} />
              <h2>İş məkanı açılır</h2>
              <p>Vakansiyalar və namizəd məlumatları yüklənir.</p>
              {error ? (
                <button
                  className="button secondary"
                  onClick={() => {
                    setError("");
                    void load();
                  }}
                >
                  Yenidən cəhd et
                </button>
              ) : null}
            </div>
          ) : selected ? (
            <VacancyDetail
              key={selected.id}
              vacancy={selected}
              config={config}
              busy={busy}
              act={act}
              activeCandidateId={candidateId}
              setCandidateId={setCandidateId}
              onBack={() => setVacancyId(null)}
              onAddCandidate={() => setModal("candidate")}
              onSettings={() => navigate("settings")}
            />
          ) : view === "overview" ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">İŞƏ QƏBUL, DAHA AYDIN</p>
                  <h1>Vakansiyalar</h1>
                  <p>
                    Doğru bacarıqları müəyyənləşdirin. Namizədləri sübutlarla
                    tanıyın.
                  </p>
                </div>
                <button
                  className="button primary"
                  onClick={() => setModal("vacancy")}
                >
                  <Plus size={18} />
                  Vakansiya yarat
                </button>
              </div>
              <section className="hero-card" aria-labelledby="hero-title">
                <div className="hero-copy">
                  <span className="hero-label">
                    <Sparkles size={14} /> BACARIQ MƏRKƏZLİ QİYMƏTLƏNDİRMƏ
                  </span>
                  <h2 id="hero-title">
                    Yaxşı seçim
                    <br />
                    sübutdan başlayır.
                  </h2>
                  <p>
                    CV-dəki iddialardan praktik müşahidələrə.
                    <br />
                    Hər namizəd üçün daha əsaslı növbəti addım.
                  </p>
                  <button
                    className="hero-link"
                    disabled={busy}
                    onClick={() => void act({ type: "seed" })}
                  >
                    {busy ? (
                      <LoaderCircle size={16} className="spin" />
                    ) : (
                      <ArrowUpRight size={17} />
                    )}
                    Satış və SOC nümunələrini yüklə<span>Uydurma demo</span>
                  </button>
                </div>
                <div className="hero-visual" aria-hidden="true">
                  <div className="visual-orbit orbit-one" />
                  <div className="visual-orbit orbit-two" />
                  <div className="proof-card proof-back">
                    <span className="mini-icon">
                      <FileText size={19} />
                    </span>
                    <div className="skeleton-line long" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line short" />
                  </div>
                  <div className="proof-card proof-front">
                    <div className="proof-title">
                      <span className="mini-check">
                        <Check size={17} />
                      </span>
                      <span>Bacarıq + sübut</span>
                    </div>
                    <div className="proof-row">
                      <span>CV-dəki iddia</span>
                      <CheckCheck size={17} />
                    </div>
                    <div className="proof-row">
                      <span>Praktik müşahidə</span>
                      <CheckCheck size={17} />
                    </div>
                    <div className="proof-foot">
                      Daha aydın qərarlar <ArrowRight size={14} />
                    </div>
                  </div>
                  <span className="floating-spark">
                    <Sparkles size={21} />
                  </span>
                </div>
              </section>
              <section
                className="metrics"
                aria-label="İş məkanının göstəriciləri"
              >
                <Metric
                  label="Vakansiya"
                  value={workspace.vacancies.length}
                  icon={BriefcaseBusiness}
                  detail="İş məkanında yaradılıb"
                />
                <Metric
                  label="Namizəd"
                  value={allCandidates.length}
                  icon={Users}
                  detail="CV mətnləri saxlanılıb"
                />
                <Metric
                  label="CV təhlili"
                  value={analysed.length}
                  icon={FileSearch}
                  detail="Mənbə ilə göstərilir"
                />
                <Metric
                  label="Təsdiqli sınaq"
                  value={approved}
                  icon={ClipboardCheck}
                  detail="HR tərəfindən yoxlanılıb"
                />
              </section>
              <section className="panel vacancy-panel">
                <div className="panel-heading">
                  <div>
                    <h2>
                      Vakansiyalarınız{" "}
                      <span className="count-pill">
                        {workspace.vacancies.length}
                      </span>
                    </h2>
                    <p>Bir vakansiyadan bütün qiymətləndirmə axınına keçin.</p>
                  </div>
                  <div className="table-tools">
                    <label className="search-input">
                      <Search size={17} />
                      <input
                        aria-label="Vakansiya axtar"
                        placeholder="Vakansiya axtar…"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                      />
                    </label>
                    <select
                      aria-label="Sahə üzrə filtr"
                      value={department}
                      onChange={(event) => setDepartment(event.target.value)}
                    >
                      <option value="all">Bütün sahələr</option>
                      {Array.from(
                        new Set(
                          workspace.vacancies.map((item) => item.department),
                        ),
                      ).map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="vacancy-table">
                  <div className="table-head">
                    <span>VAKANSİYA</span>
                    <span>NAMİZƏDLƏR</span>
                    <span>SINAQ STATUSU</span>
                    <span>
                      YARADILIB <ArrowDown size={11} />
                    </span>
                    <span />
                  </div>
                  {workspace.vacancies
                    .filter(
                      (item) =>
                        item.title
                          .toLocaleLowerCase("az")
                          .includes(query.toLocaleLowerCase("az")) &&
                        (department === "all" ||
                          item.department === department),
                    )
                    .map((vacancy) => (
                      <button
                        key={vacancy.id}
                        className="vacancy-row"
                        onClick={() => openVacancy(vacancy.id)}
                      >
                        <span className="vacancy-name">
                          <span
                            className={`job-icon ${vacancy.demoKey === "soc" ? "lavender" : "mint"}`}
                          >
                            {vacancy.demoKey === "soc" ? (
                              <ShieldCheck size={22} />
                            ) : (
                              <BriefcaseBusiness size={22} />
                            )}
                          </span>
                          <span>
                            <strong>{vacancy.title}</strong>
                            <small>
                              {vacancy.department}
                              {vacancy.demoKey ? (
                                <span className="demo-inline">
                                  Uydurma demo
                                </span>
                              ) : null}
                            </small>
                          </span>
                        </span>
                        <span className="candidate-count">
                          <Users size={15} />
                          {vacancy.candidates.length} namizəd
                        </span>
                        <span>
                          <Badge
                            tone={
                              vacancy.assessment?.approvedAt ? "green" : "amber"
                            }
                          >
                            {vacancy.assessment?.approvedAt
                              ? "Təsdiqlənib"
                              : "Qaralama"}
                          </Badge>
                        </span>
                        <span className="date-cell">
                          {date(vacancy.createdAt)}
                        </span>
                        <ArrowUpRight className="row-arrow" size={19} />
                      </button>
                    ))}
                </div>
                {workspace.vacancies.length === 0 ? (
                  <EmptyState
                    icon={BriefcaseBusiness}
                    title="İlk vakansiyanız buradan başlayır"
                    text="Yeni vakansiya yaradın və ya axını tanımaq üçün satış və SOC demo nümunələrini yükləyin."
                    action={
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() => void act({ type: "seed" })}
                      >
                        <Sparkles size={16} />
                        Demo nümunələrini yüklə
                      </button>
                    }
                  />
                ) : workspace.vacancies.filter(
                    (item) =>
                      item.title
                        .toLocaleLowerCase("az")
                        .includes(query.toLocaleLowerCase("az")) &&
                      (department === "all" || item.department === department),
                  ).length === 0 ? (
                  <EmptyState
                    icon={Search}
                    title="Uyğun vakansiya tapılmadı"
                    text="Axtarış mətnini və ya sahə filtrini dəyişin."
                  />
                ) : null}
                <div className="table-footer">
                  <span>{workspace.vacancies.length} vakansiya</span>
                  <span>
                    <ShieldCheck size={14} />
                    Məlumatlar bu iş məkanına aiddir
                  </span>
                </div>
              </section>
              <div className="principle-note">
                <CircleHelp size={17} />
                <p>
                  CV-də məlumatın olmaması bacarığın olmaması demək deyil. Hər
                  iddia praktik iş nümunəsi ilə ayrıca yoxlanmalıdır.
                </p>
              </div>
            </>
          ) : view === "settings" ? (
            <SettingsView config={config} />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">VAHİD BAXIŞ</p>
                  <h1>
                    {view === "candidates" ? "Namizədlər" : "CV təhlilləri"}
                  </h1>
                  <p>
                    {view === "candidates"
                      ? "Hər namizədin CV-si və vakansiyası bir yerdə."
                      : "CV iddiaları, mənbələr və praktik yoxlama sualları."}
                  </p>
                </div>
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <h2>
                    {view === "candidates"
                      ? "Bütün namizədlər"
                      : "Hazırlanmış təhlillər"}
                  </h2>
                  <span className="count-pill">
                    {view === "candidates"
                      ? allCandidates.length
                      : analysed.length}
                  </span>
                </div>
                {(view === "candidates" ? allCandidates : analysed).map(
                  ({ vacancy, candidate }) => (
                    <button
                      className="person-row"
                      key={candidate.id}
                      onClick={() => openVacancy(vacancy.id, candidate.id)}
                    >
                      <span className="avatar person-avatar">
                        {initials(candidate.name)}
                      </span>
                      <span className="person-info">
                        <strong>{candidate.name}</strong>
                        <small>{vacancy.title}</small>
                      </span>
                      <Badge tone={candidate.analysis ? "green" : "neutral"}>
                        {candidate.analysis
                          ? candidate.analysis.source === "saved-demo"
                            ? "Demo təhlili"
                            : "Claude təhlili"
                          : "Təhlil gözləyir"}
                      </Badge>
                      <ChevronRight size={18} />
                    </button>
                  ),
                )}
                {(view === "candidates" ? allCandidates : analysed).length ===
                0 ? (
                  <EmptyState
                    icon={view === "candidates" ? Users : FileSearch}
                    title={
                      view === "candidates"
                        ? "Hələ namizəd yoxdur"
                        : "Hələ təhlil yoxdur"
                    }
                    text="Vakansiyanı açın, namizəd CV-sini əlavə edin və uyğun təhlil növünü seçin."
                    action={
                      <button
                        className="button secondary"
                        onClick={() => navigate("overview")}
                      >
                        Vakansiyalara keç
                        <ArrowRight size={16} />
                      </button>
                    }
                  />
                ) : null}
              </section>
            </>
          )}
          <footer className="page-footer">
            <span>
              SkillProof AI <span>·</span> Bacarıqları sübutla gör.
            </span>
            <span>İnsan qərarını dəstəkləyir.</span>
          </footer>
        </main>
      </div>
      {modal === "vacancy" ? (
        <Modal
          title="Yeni vakansiya"
          description="İşin tələblərini və yoxlanacaq bacarıqları müəyyənləşdirin."
          onClose={() => setModal(null)}
          busy={busy}
        >
          <VacancyForm
            busy={busy}
            error={error}
            onSubmit={async (fields) => {
              const next = await act({ type: "create", ...fields });
              if (next) {
                setModal(null);
                openVacancy(next.vacancies[0].id);
              }
            }}
          />
        </Modal>
      ) : modal === "candidate" && selected ? (
        <Modal
          title="Namizəd əlavə et"
          description={`${selected.title} üçün CV mətnini daxil edin.`}
          onClose={() => setModal(null)}
          busy={busy}
        >
          <CandidateForm
            busy={busy}
            error={error}
            onSubmit={async (fields) => {
              const next = await act({
                type: "addCandidate",
                vacancyId: selected.id,
                ...fields,
              });
              if (next) {
                setModal(null);
                const job = next.vacancies.find(
                  (item) => item.id === selected.id,
                );
                setCandidateId(job?.candidates.at(-1)?.id ?? null);
              }
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  detail,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  detail: string;
}) {
  return (
    <div className="metric">
      <div className="metric-top">
        <span>{label}</span>
        <Icon size={19} />
      </div>
      <strong>{value.toString().padStart(2, "0")}</strong>
      <p>{detail}</p>
    </div>
  );
}
function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={25} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function VacancyForm({
  busy,
  error,
  onSubmit,
}: {
  busy: boolean;
  error: string;
  onSubmit: (fields: {
    title: string;
    department: string;
    description: string;
    skills: string[];
  }) => Promise<void>;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void onSubmit({
      title: String(form.get("title")),
      department: String(form.get("department")),
      description: String(form.get("description")),
      skills: String(form.get("skills"))
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    });
  };
  return (
    <form onSubmit={submit} className="form">
      <div className="form-grid">
        <label>
          Vəzifə adı
          <input
            name="title"
            required
            maxLength={160}
            placeholder="Məsələn, B2B satış məsləhətçisi"
          />
        </label>
        <label>
          Sahə
          <input
            name="department"
            required
            maxLength={100}
            placeholder="Məsələn, Satış"
          />
        </label>
      </div>
      <label>
        İş təsviri
        <textarea
          name="description"
          required
          minLength={30}
          maxLength={12000}
          rows={4}
          placeholder="Əsas gündəlik işləri, tələbləri və gözlənilən nəticələri yazın."
        />
      </label>
      <label>
        Yoxlanacaq bacarıqlar
        <textarea
          name="skills"
          required
          rows={4}
          placeholder={
            "Ehtiyacın müəyyənləşdirilməsi\nQiymət hesablaması\nMüştəri ünsiyyəti"
          }
        />
        <small>
          Hər sətirdə bir bacarıq. Ən çox 15 bacarıq; hər biri ən çox 160
          simvol.
        </small>
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="form-actions">
        <span>Sonradan namizəd CV-lərini əlavə edə bilərsiniz.</span>
        <button className="button primary" disabled={busy}>
          {busy ? (
            <LoaderCircle size={17} className="spin" />
          ) : (
            <Plus size={17} />
          )}
          Vakansiya yarat
        </button>
      </div>
    </form>
  );
}
function CandidateForm({
  busy,
  error,
  onSubmit,
}: {
  busy: boolean;
  error: string;
  onSubmit: (fields: { name: string; cv: string }) => Promise<void>;
}) {
  return (
    <form
      className="form"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        void onSubmit({
          name: String(form.get("name")),
          cv: String(form.get("cv")),
        });
      }}
    >
      <label>
        Namizəd adı və ya demo ID
        <input
          name="name"
          required
          maxLength={120}
          placeholder="Namizədin adı"
        />
      </label>
      <label>
        CV mətni
        <textarea
          name="cv"
          required
          minLength={30}
          maxLength={30000}
          rows={10}
          placeholder="CV mətnini buraya yapışdırın. Təcrübə və bacarıqlara aid hissələri daxil edin."
        />
        <small>
          CV sahəsində mətn yapışdırmaq mümkündür. Demo üçün uydurma məlumatdan
          istifadə edin.
        </small>
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="form-actions">
        <span>CV əvvəl saxlanılır, təhlil ayrıca başladılır.</span>
        <button className="button primary" disabled={busy}>
          {busy ? (
            <LoaderCircle size={17} className="spin" />
          ) : (
            <Check size={17} />
          )}
          Namizədi saxla
        </button>
      </div>
    </form>
  );
}

function VacancyDetail({
  vacancy,
  config,
  busy,
  act,
  activeCandidateId,
  setCandidateId,
  onBack,
  onAddCandidate,
  onSettings,
}: {
  vacancy: Vacancy;
  config: AppConfig;
  busy: boolean;
  act: Action;
  activeCandidateId: string | null;
  setCandidateId: (id: string) => void;
  onBack: () => void;
  onAddCandidate: () => void;
  onSettings: () => void;
}) {
  const [tab, setTab] = useState<"candidates" | "assessment">("candidates");
  const candidate =
    vacancy.candidates.find((person) => person.id === activeCandidateId) ??
    vacancy.candidates[0];
  return (
    <>
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} />
        Vakansiyalara qayıt
      </button>
      <div className="page-heading detail-heading">
        <div>
          <div className="detail-meta">
            <Badge tone="blue">{vacancy.department}</Badge>
            {vacancy.demoKey ? <Badge>Uydurma demo</Badge> : null}
          </div>
          <h1>{vacancy.title}</h1>
          <p>
            {vacancy.candidates.length} namizəd{" "}
            <span className="dot-separator">·</span> {vacancy.skills.length}{" "}
            bacarıq <span className="dot-separator">·</span>{" "}
            {date(vacancy.createdAt)}
          </p>
        </div>
        <button className="button primary" onClick={onAddCandidate}>
          <Plus size={17} />
          Namizəd əlavə et
        </button>
      </div>
      <div className="vacancy-description">
        <p>{vacancy.description}</p>
        <div className="skill-tags">
          {vacancy.skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      </div>
      <div className="tabs" role="tablist" aria-label="Vakansiya bölmələri">
        <button
          role="tab"
          aria-selected={tab === "candidates"}
          className={tab === "candidates" ? "active" : ""}
          onClick={() => setTab("candidates")}
        >
          <Users size={17} />
          Namizədlər və CV təhlili<span>{vacancy.candidates.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === "assessment"}
          className={tab === "assessment" ? "active" : ""}
          onClick={() => setTab("assessment")}
        >
          <ClipboardCheck size={17} />
          Sınaq layihəsi
          {vacancy.assessment?.approvedAt ? <CheckCircle2 size={15} /> : null}
        </button>
      </div>
      {tab === "assessment" ? (
        <AssessmentEditor
          key={vacancy.id}
          vacancy={vacancy}
          busy={busy}
          act={act}
        />
      ) : vacancy.candidates.length === 0 ? (
        <section className="panel">
          <EmptyState
            icon={Users}
            title="Namizədləri tanımağa başlayın"
            text="CV mətnini əlavə edin, sonra tələblərə uyğun iddiaları və mənbələri nəzərdən keçirin."
            action={
              <button className="button secondary" onClick={onAddCandidate}>
                <Plus size={16} />
                İlk namizədi əlavə et
              </button>
            }
          />
        </section>
      ) : (
        <div className="candidate-workspace">
          <aside className="panel candidate-list">
            <div className="candidate-list-heading">
              <h2>Namizədlər</h2>
              <span className="count-pill">{vacancy.candidates.length}</span>
            </div>
            {vacancy.candidates.map((person) => (
              <button
                className={`candidate-choice ${person.id === candidate.id ? "selected" : ""}`}
                key={person.id}
                onClick={() => setCandidateId(person.id)}
              >
                <span className="avatar person-avatar">
                  {initials(person.name)}
                </span>
                <span>
                  <strong>{person.name}</strong>
                  <small>
                    {person.analysis
                      ? person.analysis.source === "saved-demo"
                        ? "Saxlanmış demo"
                        : "Claude təhlili"
                      : "Təhlil gözləyir"}
                  </small>
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
          </aside>
          <div className="candidate-main">
            <section className="panel cv-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">NAMİZƏD PROFİLİ</p>
                  <h2>{candidate.name}</h2>
                </div>
                {candidate.demoKey ? (
                  <Badge>Uydurma CV</Badge>
                ) : (
                  <Badge>CV mətni</Badge>
                )}
              </div>
              <details className="cv-details">
                <summary>
                  <FileText size={17} />
                  CV mətninə bax<span>Mənbə məlumatı</span>
                </summary>
                <pre>{candidate.cv}</pre>
              </details>
              <div className="analysis-actions">
                <div>
                  <strong>İddiaları mənbə ilə yoxlayın</strong>
                  <p>
                    {config.aiReady
                      ? "Canlı təhlil üçün Claude-a işlə əlaqəli CV mətni ötürülür."
                      : "Canlı təhlil üçün əvvəl Claude bağlantısını qurun."}
                  </p>
                </div>
                <div className="button-group">
                  {candidate.demoKey && vacancy.demoKey ? (
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() =>
                        void act({
                          type: "analyze",
                          vacancyId: vacancy.id,
                          candidateId: candidate.id,
                          mode: "demo",
                        })
                      }
                    >
                      <FileSearch size={16} />
                      Demo təhlilini göstər
                    </button>
                  ) : null}
                  <button
                    className="button primary"
                    disabled={busy || !config.aiReady}
                    title={
                      !config.aiReady
                        ? "Claude bağlantısı qurulmalıdır"
                        : undefined
                    }
                    onClick={() =>
                      void act({
                        type: "analyze",
                        vacancyId: vacancy.id,
                        candidateId: candidate.id,
                        mode: "live",
                      })
                    }
                  >
                    {busy ? (
                      <LoaderCircle size={16} className="spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    Claude ilə təhlil et
                  </button>
                </div>
              </div>
              {!config.aiReady ? (
                <button
                  className="text-link connection-link"
                  onClick={onSettings}
                >
                  Bağlantı vəziyyətinə bax
                  <ArrowUpRight size={14} />
                </button>
              ) : null}
            </section>
            {candidate.analysis ? (
              <AnalysisView candidate={candidate} />
            ) : (
              <section className="panel">
                <EmptyState
                  icon={FileSearch}
                  title="Hələ təhlil hazırlanmayıb"
                  text={
                    candidate.demoKey
                      ? "Axını tanımaq üçün əvvəlcədən hazırlanmış demo təhlilini açın və ya Claude bağlantısı ilə canlı təhlil aparın."
                      : "Claude bağlantısını qurduqdan sonra bu CV-ni vakansiyanın tələblərinə görə təhlil edə bilərsiniz."
                  }
                />
              </section>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function AnalysisView({ candidate }: { candidate: Candidate }) {
  const analysis = candidate.analysis!;
  const statusLabel = {
    evidence: "Uyğun iddia var",
    verify: "Praktik yoxlanmalıdır",
    missing: "Məlumat yoxdur",
  } as const;
  return (
    <section className="panel analysis-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">MƏNBƏLİ BAXIŞ</p>
          <h2>CV nə deyir?</h2>
        </div>
        <Badge tone={analysis.source === "saved-demo" ? "amber" : "green"}>
          {analysis.source === "saved-demo"
            ? "Saxlanmış demo — canlı AI deyil"
            : "Claude · canlı təhlil"}
        </Badge>
      </div>
      <div className="analysis-summary">
        <Sparkles size={18} />
        <p>{analysis.summary}</p>
      </div>
      <div className="evidence-list">
        {analysis.items.map((item) => (
          <article className="evidence-item" key={item.skill}>
            <div className="evidence-heading">
              <h3>{item.skill}</h3>
              <Badge
                tone={
                  item.status === "missing"
                    ? "neutral"
                    : item.status === "evidence"
                      ? "green"
                      : "amber"
                }
              >
                {statusLabel[item.status]}
              </Badge>
            </div>
            {item.quote ? (
              <blockquote>
                <span>CV-DƏN MƏNBƏ</span>“{item.quote}”
              </blockquote>
            ) : (
              <p className="missing-evidence">
                Bu tələb haqqında CV-də mənbə tapılmadı.
              </p>
            )}
            <p className="observation">{item.observation}</p>
            <div className="interview-question">
              <CircleHelp size={15} />
              <span>{item.question}</span>
            </div>
          </article>
        ))}
      </div>
      <div className="analysis-footer">
        <ShieldCheck size={16} />
        <p>
          Bu nəticə CV iddialarını göstərir. Praktik bacarıq ayrıca yoxlanır;
          son qərar HR-də qalır.
        </p>
      </div>
    </section>
  );
}

function AssessmentEditor({
  vacancy,
  busy,
  act,
}: {
  vacancy: Vacancy;
  busy: boolean;
  act: Action;
}) {
  const [assessment, setAssessment] = useState<Assessment>(() =>
    vacancy.assessment
      ? structuredClone(vacancy.assessment)
      : {
          materials: "",
          stages: ["", "", ""],
          duration: 13,
          criteria: [...vacancy.skills],
        },
  );
  const [criteria, setCriteria] = useState(assessment.criteria.join("\n"));
  const [dirty, setDirty] = useState(false);
  const [savedApproval, setSavedApproval] = useState(assessment.approvedAt);
  const update = (change: Partial<Assessment>) => {
    setAssessment((current) => ({ ...current, ...change }));
    setDirty(true);
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const approve =
      submitter instanceof HTMLButtonElement && submitter.value === "approve";
    const result = await act({
      type: "saveAssessment",
      vacancyId: vacancy.id,
      assessment: {
        stages: assessment.stages,
        materials: assessment.materials,
        duration: assessment.duration,
        criteria: criteria
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      },
      approve,
    });
    if (result) {
      setDirty(false);
      setSavedApproval(
        result.vacancies.find((item) => item.id === vacancy.id)?.assessment
          ?.approvedAt,
      );
    }
  };
  return (
    <form className="assessment-form" onSubmit={submit}>
      <div className="assessment-banner">
        <ShieldCheck size={22} />
        <div>
          <strong>Sınağı namizədin gözü ilə nəzərdən keçirin.</strong>
          <p>
            Materialı, mərhələləri və meyarları yoxlayıb təsdiqləyin. Namizəd
            keçidi bu mərhələdə aktiv deyil.
          </p>
        </div>
        <Badge tone={savedApproval && !dirty ? "green" : "amber"}>
          {savedApproval && !dirty ? "HR təsdiqləyib" : "Qaralama"}
        </Badge>
      </div>
      <section className="panel form">
        <div className="section-title">
          <span className="section-number">01</span>
          <div>
            <h2>Material və müddət</h2>
            <p>Həll üçün lazım olan məlumatı aydın təqdim edin.</p>
          </div>
        </div>
        <label>
          Tapşırıq materialı
          <textarea
            rows={7}
            required
            maxLength={16000}
            value={assessment.materials}
            onChange={(event) => update({ materials: event.target.value })}
            placeholder="Məhsul cədvəli, loq sətirləri və ya iş nümunəsinin digər məlumatları…"
          />
        </label>
        <label className="duration-field">
          Sınaq müddəti
          <div className="duration-input">
            <input
              type="number"
              min={5}
              max={120}
              required
              value={
                Number.isNaN(assessment.duration) ? "" : assessment.duration
              }
              onChange={(event) =>
                update({ duration: event.target.valueAsNumber })
              }
            />
            <span>dəqiqə</span>
          </div>
          <small>İşçi müddətdir. Pilot nəticəsindən sonra təsdiqləyin.</small>
        </label>
      </section>
      <section className="panel form">
        <div className="section-title">
          <span className="section-number">02</span>
          <div>
            <h2>Üç mərhələli iş nümunəsi</h2>
            <p>İlkin həll, yeni məlumat və konkret əsaslandırma.</p>
          </div>
        </div>
        {(["İlkin həll", "Yeni şərt", "Əsaslandırma"] as const).map(
          (title, index) => (
            <label key={title}>
              <span className="stage-label">
                <span>{index + 1}</span>
                {title}
              </span>
              <textarea
                rows={4}
                required
                maxLength={12000}
                value={assessment.stages[index]}
                onChange={(event) => {
                  const stages: Assessment["stages"] = [...assessment.stages];
                  stages[index] = event.target.value;
                  update({ stages });
                }}
              />
            </label>
          ),
        )}
      </section>
      <section className="panel form">
        <div className="section-title">
          <span className="section-number">03</span>
          <div>
            <h2>Qiymətləndirmə meyarları</h2>
            <p>Hər namizəd üçün eyni meyarlar və müqayisə edilən çətinlik.</p>
          </div>
        </div>
        <label>
          Meyarlar
          <textarea
            rows={5}
            required
            value={criteria}
            onChange={(event) => {
              setCriteria(event.target.value);
              setDirty(true);
            }}
          />
          <small>
            Hər sətirdə bir meyar. Rubrikanın səviyyə izahları növbəti mərhələdə
            əlavə olunacaq.
          </small>
        </label>
      </section>
      <div className="assessment-save">
        <div>
          <strong>
            {dirty
              ? "Saxlanmamış dəyişikliklər var"
              : savedApproval
                ? "Təsdiqli layihə saxlanılıb"
                : "Layihəni nəzərdən keçirin"}
          </strong>
          <p>Dəyişiklik edilən layihə yenidən HR təsdiqi tələb edir.</p>
        </div>
        <div className="button-group">
          <button
            className="button secondary"
            type="submit"
            value="draft"
            disabled={busy}
          >
            Qaralamanı saxla
          </button>
          <button
            className="button primary"
            type="submit"
            value="approve"
            disabled={busy}
          >
            {busy ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <CheckCircle2 size={17} />
            )}
            Yoxladım, təsdiqlə
          </button>
        </div>
      </div>
    </form>
  );
}

function SettingsView({ config }: { config: AppConfig }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">İŞ MƏKANININ VƏZİYYƏTİ</p>
          <h1>Bağlantılar</h1>
          <p>
            Hansı xidmətin hazır olduğunu və məlumatın harada saxlandığını
            görün.
          </p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="panel connection-card">
          <span className="connection-icon">
            <Database size={25} />
          </span>
          <div className="connection-title">
            <h2>Məlumat saxlanması</h2>
            <Badge tone={config.storage === "supabase" ? "green" : "amber"}>
              {config.storage === "supabase"
                ? "Supabase aktivdir"
                : "Lokal demo"}
            </Badge>
          </div>
          <p>
            {config.storage === "supabase"
              ? "HR hesabı ilə öz iş məkanınızın məlumatlarına daxil olursunuz."
              : "Məlumatlar bu kompüterdə saxlanılır. Bu rejim Supabase girişi və ya yayıma hazır mühit deyil."}
          </p>
          <dl>
            <div>
              <dt>Rejim</dt>
              <dd>
                {config.storage === "supabase"
                  ? "Supabase + HR girişi"
                  : "Yalnız localhost"}
              </dd>
            </div>
            <div>
              <dt>Hesab</dt>
              <dd>{config.account ?? "Demo brauzer sessiyası"}</dd>
            </div>
          </dl>
        </section>
        <section className="panel connection-card">
          <span className="connection-icon purple">
            <Sparkles size={25} />
          </span>
          <div className="connection-title">
            <h2>Claude / Anthropic</h2>
            <Badge tone={config.aiReady ? "green" : "neutral"}>
              {config.aiReady ? "Konfiqurasiya var" : "Qurulmayıb"}
            </Badge>
          </div>
          <p>
            {config.aiReady
              ? "Lokal dəyişənlər qurulub. API bağlantısının işləməsi ilk canlı sorğu ilə yoxlanacaq."
              : "Canlı CV təhlili açılana qədər yalnız əvvəlcədən hazırlanmış demo təhlilləri istifadə oluna bilər."}
          </p>
          <dl>
            <div>
              <dt>Model</dt>
              <dd>{config.model || "Seçilməyib"}</dd>
            </div>
            <div>
              <dt>Giriş açarı</dt>
              <dd>
                {config.aiReady
                  ? "Serverdə konfiqurasiya edilib"
                  : "Lokal konfiqurasiya gözlənilir"}
              </dd>
            </div>
          </dl>
        </section>
      </div>
      <section className="panel setup-guide">
        <h2>Bağlantını necə hazırlamaq olar?</h2>
        <ol>
          <li>
            <span>1</span>
            <div>
              <strong>Lokal konfiqurasiya</strong>
              <p>
                Layihədəki <code>.env.example</code> faylını{" "}
                <code>.env.local</code> adı ilə kopyalayın. Real açarları yalnız
                həmin lokal fayla yazın.
              </p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>Supabase və Claude</strong>
              <p>
                Supabase URL/açar cütünü və Claude üçün{" "}
                <code>ANTHROPIC_API_KEY</code>, <code>ANTHROPIC_MODEL</code>{" "}
                dəyişənlərini doldurun. Baza miqrasiyası və HR hesabı ayrıca
                hazırlanmalıdır.
              </p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>Serveri yenidən başladın</strong>
              <p>
                Dəyişənlər oxunduqdan sonra canlı CV sorğusu ilə bağlantını
                yoxlayın. Konfiqurasiya mövcudluğu uğurlu API sınağı demək
                deyil.
              </p>
            </div>
          </li>
        </ol>
        <div className="principle-note">
          <ShieldCheck size={17} />
          <p>
            Açarları çata, CV sahəsinə və Git deposuna daxil etməyin. Bu ekranda
            sirr dəyərləri göstərilmir.
          </p>
        </div>
      </section>
    </>
  );
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <main className="login-page">
      <div className="login-story">
        <Brand />
        <div>
          <p className="hero-label">BACARIQ MƏRKƏZLİ İŞƏ QƏBUL</p>
          <h1>
            CV-dən irəli.
            <br />
            Sübuta doğru.
          </h1>
          <p>
            İddiaları praktik müşahidələrə bağlayın.
            <br />
            Növbəti qərarınızı daha aydın görün.
          </p>
        </div>
        <span>SkillProof AI · İnsan nəzarəti ilə</span>
      </div>
      <div className="login-form-wrap">
        <form
          className="form login-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setBusy(true);
            setError("");
            try {
              const response = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: form.get("email"),
                  password: form.get("password"),
                }),
              });
              const data: { error?: string } = await response.json();
              if (!response.ok)
                throw new Error(data.error || "Giriş alınmadı.");
              onSuccess();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Bağlantı alınmadı.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <span className="empty-icon">
            <ShieldCheck size={27} />
          </span>
          <div>
            <p className="eyebrow">XOŞ GƏLMİSİNİZ</p>
            <h2>HR hesabınıza daxil olun</h2>
            <p>Vakansiyalarınız və namizədləriniz sizi gözləyir.</p>
          </div>
          <label>
            E-poçt
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="ad@sirket.az"
            />
          </label>
          <label>
            Şifrə
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="button primary" disabled={busy}>
            {busy ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              <ArrowRight size={18} />
            )}
            Daxil ol
          </button>
          <p className="login-footnote">
            Supabase-də yaradılmış və təsdiqlənmiş HR hesabınızdan istifadə
            edin.
          </p>
        </form>
      </div>
    </main>
  );
}
