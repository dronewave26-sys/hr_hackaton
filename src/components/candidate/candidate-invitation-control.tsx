"use client";
import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/candidate/api";
import {
  invitationResponseSchema,
  type InvitationInput,
} from "@/lib/candidate/contracts";
import s from "./candidate.module.css";
type InvitationProps = {
  vacancyId: string;
  candidateId: string;
  workspaceRevision: number;
  approved: boolean;
};
export function CandidateInvitationControl(props: InvitationProps) {
  return (
    <InvitationControl
      key={`${props.vacancyId}:${props.candidateId}`}
      {...props}
    />
  );
}
function InvitationControl({
  vacancyId,
  candidateId,
  workspaceRevision,
  approved,
}: InvitationProps) {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const flight = useRef(false),
    request = useRef<InvitationInput | null>(null);
  const [lostId, setLostId] = useState("");
  async function create() {
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    setMessage("");
    request.current ??= {
      vacancyId,
      candidateId,
      workspaceRevision,
      requestId: crypto.randomUUID(),
    };
    try {
      const result = await api(
        "/api/candidate-invitations",
        invitationResponseSchema,
        request.current,
      );
      if (result.url) {
        setUrl(result.url);
        setMessage(
          "Keçid hazırdır. Yalnız nəzərdə tutulan namizədlə paylaşın.",
        );
      } else {
        setLostId(result.invitationId);
        setMessage(
          "Dəvət artıq yaradılıb, lakin sirr yenidən göstərilmir. İtmiş keçidi ləğv edib yenisini yarada bilərsiniz.",
        );
      }
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500)
        request.current = null;
      setMessage(err instanceof Error ? err.message : "Dəvət yaradılmadı.");
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  async function replaceLost() {
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    try {
      const response = await fetch(
        `/api/candidate-invitations/${lostId}/revoke`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        },
      );
      if (!response.ok)
        throw new Error("İtmiş dəvət ləğv edilmədi. Təkrar cəhd edin.");
      request.current = null;
      setLostId("");
      setMessage("İtmiş keçid ləğv edildi. Yeni dəvət yarada bilərsiniz.");
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  return (
    <section className={s.control} aria-label="Namizəd dəvəti">
      <button
        className={s.button}
        disabled={!approved || busy || !!url || !!lostId}
        onClick={() => void create()}
      >
        Namizəd keçidi yarat
      </button>
      {!approved && <p>Əvvəlcə sınağı təsdiqləyin.</p>}
      {url && (
        <>
          <label className={s.label}>
            Dəvət keçidi
            <input
              readOnly
              value={url}
              onFocus={(event) => event.target.select()}
            />
          </label>
          <button
            className={`${s.button} ${s.secondary}`}
            onClick={() =>
              void navigator.clipboard.writeText(url).then(
                () => setMessage("Keçid kopyalandı."),
                () =>
                  setMessage(
                    "Avtomatik kopyalanmadı. Keçidi seçib əl ilə kopyalayın.",
                  ),
              )
            }
          >
            Keçidi kopyala
          </button>
        </>
      )}
      {lostId && (
        <button
          className={s.button}
          disabled={busy}
          onClick={() => void replaceLost()}
        >
          İtmiş keçidi ləğv et
        </button>
      )}
      <p role="status">{busy ? "Sorğu göndərilir…" : message}</p>
    </section>
  );
}
