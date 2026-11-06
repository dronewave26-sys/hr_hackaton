"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { z } from "zod";
import { invitationDetailSchema } from "@/lib/candidate/contracts";
import {
  invitationListResponseSchema,
  practicalReportResponseSchema,
  type InvitationList,
  type PracticalReport,
} from "@/lib/reports/contracts";
import s from "./practical-results.module.css";

type InvitationDetail = z.infer<typeof invitationDetailSchema>["invitation"];
type ReportResponse = z.infer<typeof practicalReportResponseSchema>;
type DetailState = { id: string; detail?: InvitationDetail; error?: string };
type ReportState = { id: string; data?: ReportResponse; error?: string };
const statusLabel = {
  ready: "Başlanmayıb",
  active: "Davam edir",
  submitted: "Göndərilib",
  expired: "Vaxt bitib",
  revoked: "Ləğv edilib",
} as const;
const stageLabel = {
  1: "İlkin həll",
  2: "Yeni şərt",
  3: "Əsaslandırma",
} as const;
function timestamp(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
async function read<T>(
  url: string,
  schema: z.ZodType<T>,
  signal: AbortSignal,
  body?: object,
): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    signal,
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data: unknown = await response.json();
  if (!response.ok) {
    const error = z.object({ error: z.string() }).safeParse(data);
    throw new Error(
      error.success ? error.data.error : "Məlumat alınmadı. Təkrar cəhd edin.",
    );
  }
  return schema.parse(data);
}
const message = (error: unknown) =>
  error instanceof Error ? error.message : "Bağlantı alınmadı.";

export function PracticalResults(props: {
  vacancyId: string;
  candidateId: string;
}) {
  return (
    <ResultsPanel key={`${props.vacancyId}:${props.candidateId}`} {...props} />
  );
}

function ResultsPanel({
  vacancyId,
  candidateId,
}: {
  vacancyId: string;
  candidateId: string;
}) {
  const [invitations, setInvitations] = useState<InvitationList | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [detailState, setDetailState] = useState<DetailState | null>(null);
  const [reportState, setReportState] = useState<ReportState | null>(null);
  const [generating, setGenerating] = useState(false);
  const generation = useRef<AbortController | null>(null);
  const selectId = useId();
  const selectedRevision = invitations?.find(
    (item) => item.invitationId === selectedId,
  )?.revision;

  useEffect(() => {
    const controller = new AbortController();
    const url = `/api/candidate-invitations?vacancyId=${encodeURIComponent(vacancyId)}&candidateId=${encodeURIComponent(candidateId)}`;
    void read(url, invitationListResponseSchema, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setInvitations(result.invitations);
        setSelectedId((current) =>
          result.invitations.some((item) => item.invitationId === current)
            ? current
            : (result.invitations[0]?.invitationId ?? ""),
        );
        setListError("");
        setListLoading(false);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setListError(message(error));
          setListLoading(false);
        }
      });
    return () => controller.abort();
  }, [vacancyId, candidateId, refresh]);

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    const base = `/api/candidate-invitations/${encodeURIComponent(selectedId)}`;
    void read(base, invitationDetailSchema, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted)
          setDetailState({ id: selectedId, detail: result.invitation });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setDetailState({ id: selectedId, error: message(error) });
      });
    void read(
      `${base}/report`,
      practicalReportResponseSchema,
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted)
          setReportState({ id: selectedId, data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setReportState({ id: selectedId, error: message(error) });
      });
    return () => controller.abort();
  }, [selectedId, selectedRevision, refresh]);

  useEffect(() => () => generation.current?.abort(), []);
  const detail =
    detailState?.id === selectedId ? detailState.detail : undefined;
  const detailError =
    detailState?.id === selectedId ? detailState.error : undefined;
  const reportData =
    reportState?.id === selectedId ? reportState.data : undefined;
  const reportError =
    reportState?.id === selectedId ? reportState.error : undefined;
  const final = detail?.status === "submitted" || detail?.status === "expired";

  function refreshResults() {
    generation.current?.abort();
    generation.current = null;
    setGenerating(false);
    setListLoading(true);
    setRefresh((value) => value + 1);
  }
  function selectInvitation(id: string) {
    generation.current?.abort();
    generation.current = null;
    setGenerating(false);
    setSelectedId(id);
  }
  async function generate() {
    if (!selectedId || !final || !reportData?.aiReady || generating) return;
    const id = selectedId;
    const controller = new AbortController();
    generation.current?.abort();
    generation.current = controller;
    setGenerating(true);
    try {
      const data = await read(
        `/api/candidate-invitations/${encodeURIComponent(id)}/report`,
        practicalReportResponseSchema,
        controller.signal,
        {},
      );
      if (!controller.signal.aborted) setReportState({ id, data });
    } catch (error) {
      if (!controller.signal.aborted)
        setReportState({ id, data: reportData, error: message(error) });
    } finally {
      if (generation.current === controller) {
        generation.current = null;
        setGenerating(false);
      }
    }
  }

  return (
    <section
      className={`panel ${s.panel}`}
      aria-label="Praktik sınaq nəticələri"
    >
      <div className={s.heading}>
        <div>
          <p className="eyebrow">CAVABLARDAN MÜŞAHİDƏLƏRƏ</p>
          <h2>Praktik sınaq nəticələri</h2>
          <p>
            Qəbul olunmuş cavablar, sınaq tarixçəsi və əsaslandırılmış
            qiymətləndirmə.
          </p>
        </div>
        <button
          className="button secondary"
          onClick={refreshResults}
          disabled={listLoading}
        >
          <RefreshCw size={15} className={listLoading ? "spin" : undefined} />
          Yenilə
        </button>
      </div>
      <p className={s.refreshHint}>
        Yeni dəvət yaratdıqdan və ya namizəd cavab verdikdən sonra nəticələri
        yeniləyin.
      </p>
      {listError ? (
        <p className={s.error} role="alert">
          {listError}
        </p>
      ) : null}
      {invitations === null && listLoading ? (
        <p className={s.loading}>
          <LoaderCircle size={18} className="spin" />
          Sınaq tarixçəsi yüklənir…
        </p>
      ) : invitations?.length === 0 ? (
        <div className={s.empty}>
          <ClipboardCheck size={25} />
          <h3>Bu namizəd üçün sınaq tarixçəsi yoxdur</h3>
          <p>
            Təsdiqli sınaqdan dəvət yaradın. Namizədin göndərdiyi cavablar
            burada görünəcək.
          </p>
        </div>
      ) : null}
      {invitations && invitations.length > 0 ? (
        <>
          <div className={s.history}>
            <label htmlFor={selectId}>
              Sınaq tarixçəsi <span>{invitations.length} dəvət</span>
            </label>
            <select
              id={selectId}
              value={selectedId}
              onChange={(event) => selectInvitation(event.target.value)}
            >
              {invitations.map((item, index) => (
                <option key={item.invitationId} value={item.invitationId}>
                  Sınaq {index + 1} · {statusLabel[item.status]} ·{" "}
                  {item.completedAt
                    ? timestamp(item.completedAt)
                    : item.invitationId.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          {detailError ? (
            <p className={s.error} role="alert">
              {detailError}
            </p>
          ) : !detail ? (
            <p className={s.loading}>
              <LoaderCircle size={18} className="spin" />
              Qəbul olunmuş cavablar yüklənir…
            </p>
          ) : (
            <>
              <div className={s.sessionMeta}>
                <span className={s.status}>{statusLabel[detail.status]}</span>
                <span>Başlama: {timestamp(detail.startedAt)}</span>
                <span>Yekun: {timestamp(detail.completedAt)}</span>
                <span>{detail.durationMinutes} dəqiqə</span>
              </div>
              <details className={s.snapshot}>
                <summary>Sınağın təsdiqlənmiş materialı və meyarları</summary>
                <p className={s.preserve}>{detail.assessment.materials}</p>
                <h3>Qiymətləndirmə meyarları</h3>
                <ul>
                  {detail.assessment.criteria.map((criterion, index) => (
                    <li key={`${index}:${criterion}`}>{criterion}</li>
                  ))}
                </ul>
                <p className={s.muted}>
                  Bu surət dəvət yaradılan anda saxlanılıb. Sonrakı layihə
                  dəyişiklikləri onu əvəz etmir.
                </p>
              </details>
              <div className={s.answers}>
                <h3>Serverin qəbul etdiyi cavablar</h3>
                {detail.unlockedStages.length === 0 ? (
                  <p className={s.muted}>
                    Namizəd sınağa hələ başlamayıb. Qəbul olunmuş cavab yoxdur.
                  </p>
                ) : (
                  detail.unlockedStages.map((stage) => (
                    <article className={s.answer} key={stage.stage}>
                      <div className={s.answerHeading}>
                        <h4>
                          {stage.stage}. {stageLabel[stage.stage]}
                        </h4>
                        <span>
                          {stage.locked ? "Kilidlənib" : "Aktiv mərhələ"}
                        </span>
                      </div>
                      <details>
                        <summary>Tapşırığın şərti</summary>
                        <p className={s.preserve}>{stage.prompt}</p>
                      </details>
                      {stage.acceptedAnswer ? (
                        <p className={`${s.preserve} ${s.answerText}`}>
                          {stage.acceptedAnswer}
                        </p>
                      ) : (
                        <p className={s.noAnswer}>
                          Bu mərhələdə hələ qəbul olunmuş cavab yoxdur.
                        </p>
                      )}
                      <small>Son qəbul: {timestamp(stage.savedAt)}</small>
                    </article>
                  ))
                )}
              </div>
              <div className={s.reportSection}>
                <div className={s.reportHeading}>
                  <div>
                    <h3>
                      <FileSearch size={18} />
                      Praktik qiymətləndirmə
                    </h3>
                    <p>
                      Qiymətləndirmə yalnız qəbul olunmuş cavab və təsdiqli
                      meyarlara əsaslanır.
                    </p>
                  </div>
                  {!reportData?.report ? (
                    <button
                      className="button primary"
                      disabled={!final || !reportData?.aiReady || generating}
                      onClick={() => void generate()}
                    >
                      {generating ? (
                        <LoaderCircle className="spin" size={16} />
                      ) : (
                        <ClipboardCheck size={16} />
                      )}
                      Claude hesabatını hazırla
                    </button>
                  ) : null}
                </div>
                {!final ? (
                  <p className={s.muted}>
                    Hesabat sınaq yekunlaşdıqdan və ya vaxt bitdikdən sonra
                    hazırlana bilər.
                  </p>
                ) : reportData && !reportData.aiReady && !reportData.report ? (
                  <p className={s.muted}>
                    Claude bağlantısı qurulmayıb. Qəbul olunmuş cavablar
                    yuxarıda saxlanmış şəkildə görünür.
                  </p>
                ) : null}
                {reportError ? (
                  <p className={s.error} role="alert">
                    {reportError}
                  </p>
                ) : null}
                {!reportState || reportState.id !== selectedId ? (
                  <p className={s.muted}>Hesabat vəziyyəti yoxlanır…</p>
                ) : null}
                {reportData?.report ? (
                  <ReportView report={reportData.report} />
                ) : reportData && final && reportData.aiReady && !generating ? (
                  <p className={s.muted}>Hələ praktik hesabat hazırlanmayıb.</p>
                ) : null}
                {generating ? (
                  <p className={s.muted} role="status">
                    Claude cavabları qiymətləndirir və mənbələr yoxlanır.
                    Nəticəni gözləyin…
                  </p>
                ) : null}
              </div>
            </>
          )}
        </>
      ) : null}
      <div className={s.humanNote}>
        <ShieldCheck size={17} />
        <p>
          AI nəticəsi ilkin qiymətləndirmədir. Namizədin cavabını və
          qeyri-müəyyənlikləri insan yoxlamalıdır; son qərar HR-də qalır.
        </p>
      </div>
    </section>
  );
}

function ReportView({ report }: { report: PracticalReport }) {
  const levels = {
    demonstrated: "Cavabda göstərilib",
    partial: "Qismən göstərilib",
    not_demonstrated: "Bu cavabda göstərilməyib",
  } as const;
  return (
    <div className={s.report}>
      <div className={s.reportSource}>
        <CheckCircle2 size={16} />
        <span>Claude · saxlanmış qiymətləndirmə</span>
        <small>{timestamp(report.createdAt)}</small>
      </div>
      <p className={s.summary}>{report.summary}</p>
      {report.criteria.map((item, index) => (
        <article className={s.criterion} key={`${index}:${item.criterion}`}>
          <div className={s.criterionHeading}>
            <h4>{item.criterion}</h4>
            <span className={`${s.level} ${s[item.level]}`}>
              {levels[item.level]}
            </span>
          </div>
          {item.evidence.length ? (
            item.evidence.map((proof, evidenceIndex) => (
              <blockquote key={`${proof.stage}:${evidenceIndex}`}>
                <span>Mərhələ {proof.stage} · cavabdan sübut</span>
                {proof.quote}
              </blockquote>
            ))
          ) : (
            <p className={s.muted}>
              Bu meyar üçün cavabdan konkret sübut göstərilməyib.
            </p>
          )}
          <p>{item.reason}</p>
          <div className={s.question}>
            <strong>Canlı yoxlama sualı</strong>
            <p>{item.question}</p>
          </div>
        </article>
      ))}
      {report.limitations.length ? (
        <div className={s.limitations}>
          <h4>Açıq məqamlar və məhdudiyyətlər</h4>
          <ul>
            {report.limitations.map((limitation, index) => (
              <li key={index}>{limitation}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <small className={s.model}>
        Model: {report.model}. Bal və avtomatik işə qəbul qərarı verilmir.
      </small>
    </div>
  );
}
