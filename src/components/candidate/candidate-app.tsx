"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/candidate/api";
import {
  MAX_ANSWER,
  sessionResponseSchema,
  type CandidateSessionView,
  type Mutation,
} from "@/lib/candidate/contracts";
import s from "./candidate.module.css";

export function CandidateApp({ invitationId }: { invitationId: string }) {
  const [session, setSession] = useState<CandidateSessionView | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const current = useRef<CandidateSessionView | null>(null),
    draftRef = useRef<Record<number, string>>({});
  const flight = useRef(false),
    pending = useRef<Mutation | null>(null);
  const anchor = useRef({ server: 0, local: 0 });
  const heading = useRef<HTMLHeadingElement>(null),
    dialog = useRef<HTMLDialogElement>(null);
  const accept = useCallback((next: CandidateSessionView, preserve = true) => {
    const previous = current.current;
    if (previous && next.revision < previous.revision) return;
    const nextDrafts = { ...draftRef.current };
    for (const stage of next.unlockedStages) {
      const old = previous?.unlockedStages.find(
        (item) => item.stage === stage.stage,
      );
      if (
        !preserve ||
        nextDrafts[stage.stage] === undefined ||
        (old && nextDrafts[stage.stage] === old.acceptedAnswer)
      )
        nextDrafts[stage.stage] = stage.acceptedAnswer;
    }
    draftRef.current = nextDrafts;
    setDrafts(nextDrafts);
    current.current = next;
    setSession(next);
    anchor.current = {
      server: Date.parse(next.serverNow),
      local: performance.now(),
    };
    setRemaining(
      next.expiresAt
        ? Math.max(
            0,
            Math.ceil(
              (Date.parse(next.expiresAt) - Date.parse(next.serverNow)) / 1000,
            ),
          )
        : 0,
    );
    if (
      previous?.currentStage !== next.currentStage ||
      previous?.status !== next.status
    )
      requestAnimationFrame(() => heading.current?.focus());
  }, []);
  const refresh = useCallback(async () => {
    const result = await api(
      `/api/candidate/session?invitationId=${encodeURIComponent(invitationId)}`,
      sessionResponseSchema,
    ).catch((err) => {
      if (
        err instanceof ApiError &&
        err.code === "REVOKED" &&
        current.current
      ) {
        accept({ ...current.current, status: "revoked" });
      }
      throw err;
    });
    const prior = current.current;
    if (
      prior &&
      result.session.revision > prior.revision &&
      prior.unlockedStages.some(
        (item) => draftRef.current[item.stage] !== item.acceptedAnswer,
      )
    ) {
      setError(
        "Sessiya başqa sorğuda dəyişib. Yerli qaralamanız qorunub. Server cavabını müqayisə edib saxlamağa yenidən cəhd edin.",
      );
    }
    accept(result.session);
    return result.session;
  }, [invitationId, accept]);
  const load = useCallback(async () => {
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    setError("");
    try {
      const secret = window.location.hash.slice(1);
      if (secret) {
        const result = await api(
          "/api/candidate/exchange",
          sessionResponseSchema,
          { invitationId, secret },
        );
        window.history.replaceState(null, "", window.location.pathname);
        accept(result.session);
      } else await refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Bağlantı alınmadı. Təkrar cəhd edin.",
      );
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }, [invitationId, accept, refresh]);
  useEffect(() => {
    const task = setTimeout(() => void load(), 0);
    return () => clearTimeout(task);
  }, [load]);
  useEffect(() => {
    const timer = setInterval(() => {
      const state = current.current;
      if (state?.expiresAt)
        setRemaining(
          Math.max(
            0,
            Math.ceil(
              (Date.parse(state.expiresAt) -
                anchor.current.server -
                (performance.now() - anchor.current.local)) /
                1000,
            ),
          ),
        );
    }, 1000);
    const poll = setInterval(() => {
      if (!flight.current && current.current?.status === "active") {
        flight.current = true;
        void refresh()
          .catch((err) =>
            setError(
              err instanceof ApiError
                ? err.message
                : "Serverlə əlaqə kəsilib. Qaralamanız bu səhifədə qalır.",
            ),
          )
          .finally(() => {
            flight.current = false;
          });
      }
    }, 10000);
    return () => {
      clearInterval(timer);
      clearInterval(poll);
    };
  }, [refresh]);
  const mutate = useCallback(
    async (type: Mutation["type"]) => {
      if (flight.current || !current.current) return;
      const state = current.current;
      const action: Mutation =
        pending.current ??
        (type === "start"
          ? {
              type,
              invitationId,
              requestId: crypto.randomUUID(),
              revision: state.revision,
            }
          : {
              type,
              invitationId,
              requestId: crypto.randomUUID(),
              revision: state.revision,
              stage: state.currentStage!,
              answer: draftRef.current[state.currentStage!] ?? "",
            });
      flight.current = true;
      pending.current = action;
      setBusy(true);
      setError("");
      try {
        const result = await api(
          "/api/candidate/session",
          sessionResponseSchema,
          action,
        );
        pending.current = null;
        accept(result.session);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Saxlanmadı. Mətniniz bu səhifədə qalır. Eyni sorğunu yenidən göndərin.",
        );
        if (err instanceof ApiError && err.status < 500) {
          pending.current = null;
          if (err.status === 409 || err.status === 410) {
            try {
              await refresh();
            } catch {
              /* keep draft and original error */
            }
          }
        }
      } finally {
        flight.current = false;
        setBusy(false);
      }
    },
    [accept, invitationId, refresh],
  );
  const stage = session?.unlockedStages.find(
    (item) => item.stage === session.currentStage,
  );
  const draft = stage ? (drafts[stage.stage] ?? "") : "";
  const dirty = !!stage && draft !== stage.acceptedAnswer;
  useEffect(() => {
    if (!dirty || busy || error || session?.status !== "active") return;
    const timeout = setTimeout(() => void mutate("save"), 900);
    return () => clearTimeout(timeout);
  }, [draft, dirty, busy, error, session?.status, mutate]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty || pending.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  return (
    <main className={s.shell}>
      <div className={s.wrap}>
        <header className={s.header}>
          <span className={s.brand}>SkillProof AI · Namizəd sınağı</span>
          {session?.status === "active" && (
            <span className={s.timer} aria-label="Qalan vaxt">
              Qalan vaxt: {Math.floor(remaining / 60)}:
              {String(remaining % 60).padStart(2, "0")}
            </span>
          )}
        </header>
        <section className={s.card}>
          <h1 ref={heading} tabIndex={-1}>
            {session?.vacancyTitle ?? "Sınağa giriş"}
          </h1>
          {error && (
            <div className={s.error} role="alert">
              <p>{error}</p>
              <button
                className={s.button}
                disabled={busy}
                onClick={() =>
                  session?.status === "active" || session?.status === "ready"
                    ? void mutate(
                        pending.current?.type ??
                          (session.status === "ready" ? "start" : "save"),
                      )
                    : void load()
                }
              >
                Təkrar cəhd et
              </button>
            </div>
          )}
          {!session && !error && <p role="status">Sınaq yüklənir…</p>}
          {session?.status === "ready" && (
            <>
              <h2>Başlamazdan əvvəl</h2>
              <p>
                Ümumi müddət: <strong>{session.durationMinutes} dəqiqə</strong>.
                Üç mərhələni ardıcıllıqla tamamlayacaqsınız.
              </p>
              <ul>
                <li>
                  Vaxt yalnız “Sınağa başla” düyməsinə basdıqdan sonra başlayır.
                  Səhifəni bağlamaq vaxtı dayandırmır.
                </li>
                <li>
                  Cavablar avtomatik saxlanır. Yalnız “Saxlandı” statusu
                  serverin cavabı qəbul etdiyini bildirir.
                </li>
                <li>
                  Növbəti mərhələyə keçəndən sonra əvvəlki cavab dəyişdirilmir.
                  Vaxt bitəndə son qəbul olunmuş cavablar yekunlaşır.
                </li>
                <li>
                  Saxlanmamış mətn səhifəni yeniləyəndə itə bilər. Şəbəkə
                  xətasında təkrar cəhd edin.
                </li>
                <li>
                  Cavablar, başlama, saxlama və bitmə vaxtları qeydə alınır.
                  Kamera, mikrofon və tab izləməsi aparılmır.
                </li>
              </ul>
              <button
                className={s.button}
                disabled={busy}
                onClick={() => void mutate("start")}
              >
                Qaydalarla tanış oldum, sınağa başla
              </button>
            </>
          )}
          {session && session.status !== "ready" && (
            <>
              <ol className={s.steps} aria-label="Sınaq mərhələləri">
                {["İlkin həll", "Yeni şərt", "Əsaslandırma"].map((name, i) => (
                  <li
                    key={name}
                    aria-current={
                      session.currentStage === i + 1 ? "step" : undefined
                    }
                  >
                    {i + 1}. {name}
                  </li>
                ))}
              </ol>
              {session.status !== "active" && (
                <div role="status">
                  <h2>
                    {session.status === "submitted"
                      ? "Cavablar göndərildi"
                      : session.status === "expired"
                        ? "Vaxt bitdi"
                        : "Dəvət ləğv edilib"}
                  </h2>
                  <p>
                    Serverdə qəbul olunmuş cavablar kilidlənib.{" "}
                    {session.completedAt &&
                      `Yekun vaxtı: ${new Date(session.completedAt).toLocaleString("az-AZ")}`}
                  </p>
                </div>
              )}
              <details open>
                <summary>Tapşırıq materialı</summary>
                <div className={s.text}>{session.materials}</div>
              </details>
              {session.unlockedStages
                .filter((item) => item.stage !== session.currentStage)
                .map((item) => (
                  <details key={item.stage}>
                    <summary>
                      Mərhələ {item.stage} · qəbul olunmuş cavab
                    </summary>
                    <p className={s.text}>{item.prompt}</p>
                    <p className={s.text}>
                      {item.acceptedAnswer || "Boş cavab"}
                    </p>
                    {drafts[item.stage] !== item.acceptedAnswer && (
                      <div className={s.error}>
                        <p>Bu tabda qalan, qəbul olunmamış qaralama:</p>
                        <p className={s.text}>{drafts[item.stage]}</p>
                      </div>
                    )}
                  </details>
                ))}
              {stage && (
                <>
                  <h2>Mərhələ {stage.stage} / 3</h2>
                  <p className={s.text}>{stage.prompt}</p>
                  <label className={s.label} htmlFor="candidate-answer">
                    Cavabınız
                  </label>
                  <textarea
                    id="candidate-answer"
                    className={s.answer}
                    value={draft}
                    maxLength={MAX_ANSWER}
                    readOnly={session.status !== "active"}
                    onChange={(event) => {
                      const next = {
                        ...draftRef.current,
                        [stage.stage]: event.target.value,
                      };
                      draftRef.current = next;
                      setDrafts(next);
                    }}
                  />
                  <p>
                    {draft.length} / {MAX_ANSWER} simvol
                  </p>
                  <p className={s.status} role="status">
                    {busy
                      ? "Saxlanır…"
                      : dirty
                        ? "Saxlanmadı — yerli qaralama"
                        : stage.savedAt
                          ? "Saxlandı"
                          : "Hələ cavab saxlanmayıb"}
                  </p>
                  {(error || (dirty && session.status !== "active")) && (
                    <details open>
                      <summary>Serverin qəbul etdiyi cavab</summary>
                      <p className={s.text}>
                        {stage.acceptedAnswer || "Boş cavab"}
                      </p>
                      <p>Yuxarıdakı qaralama avtomatik əvəz edilmir.</p>
                    </details>
                  )}
                  {session.status === "active" && (
                    <div className={s.actions}>
                      <button
                        className={`${s.button} ${s.secondary}`}
                        disabled={busy}
                        onClick={() => void mutate("save")}
                      >
                        İndi saxla
                      </button>
                      <button
                        className={s.button}
                        disabled={busy || !!error}
                        onClick={() =>
                          stage.stage === 3
                            ? dialog.current?.showModal()
                            : void mutate("advance")
                        }
                      >
                        {stage.stage === 3
                          ? "Yekun göndər"
                          : "Cavabı qəbul et və davam et"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
        <dialog
          ref={dialog}
          className={s.dialog}
          aria-labelledby="submit-title"
        >
          <h2 id="submit-title">Sınağı yekunlaşdırmaq istəyirsiniz?</h2>
          <p>
            Cari cavab da göndəriləcək. Bundan sonra cavabları dəyişmək mümkün
            olmayacaq.
          </p>
          <div className={s.actions}>
            <button
              className={`${s.button} ${s.secondary}`}
              onClick={() => dialog.current?.close()}
            >
              Geri qayıt
            </button>
            <button
              className={s.button}
              onClick={() => {
                dialog.current?.close();
                void mutate("submit");
              }}
            >
              Təsdiqlə və göndər
            </button>
          </div>
        </dialog>
      </div>
    </main>
  );
}
