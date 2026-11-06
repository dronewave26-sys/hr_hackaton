// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CandidateApp } from "@/components/candidate/candidate-app";
import { CandidateInvitationControl } from "@/components/candidate/candidate-invitation-control";
import type { CandidateSessionView } from "@/lib/candidate/contracts";
let root: Root, container: HTMLDivElement, state: CandidateSessionView;
let fetchMock: ReturnType<typeof vi.fn>;
const answer = () => container.querySelector("textarea")!;
const response = (data: unknown, status = 200) => ({
  ok: status === 200,
  status,
  json: async () => data,
});
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("requestAnimationFrame", (callback: () => void) =>
    setTimeout(callback, 0),
  );
  state = {
    invitationId: crypto.randomUUID(),
    sessionId: crypto.randomUUID(),
    vacancyTitle: "Satış sınağı",
    status: "active",
    durationMinutes: 13,
    serverNow: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 780000).toISOString(),
    completedAt: null,
    revision: 1,
    currentStage: 1,
    materials: "Məhsul cədvəli",
    unlockedStages: [
      {
        stage: 1,
        prompt: "İlkin tapşırıq",
        acceptedAnswer: "",
        savedAt: null,
        locked: false,
      },
    ],
  };
  fetchMock = vi.fn(async () => response({ session: structuredClone(state) }));
  vi.stubGlobal("fetch", fetchMock);
  window.history.replaceState(null, "", "/candidate/test");
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
async function render() {
  await act(async () =>
    root.render(
      createElement(CandidateApp, { invitationId: state.invitationId }),
    ),
  );
  await tick(1);
}
async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
async function type(value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(answer(), value);
    answer().dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function click(text: string) {
  const button = [...container.querySelectorAll("button")].find((b) =>
    b.textContent?.includes(text),
  )!;
  expect(button).toBeTruthy();
  await act(async () => button.click());
}
it("shows rules without future content and uses only candidate endpoints", async () => {
  state.status = "ready";
  state.currentStage = null;
  state.materials = null;
  state.unlockedStages = [];
  state.expiresAt = null;
  await render();
  expect(container.textContent).toContain("Başlamazdan əvvəl");
  expect(container.querySelector("textarea")).toBeNull();
  expect(
    fetchMock.mock.calls.every((call) =>
      String(call[0]).startsWith("/api/candidate/"),
    ),
  ).toBe(true);
});
it("does not show saved before acknowledgement and preserves edits made during save", async () => {
  await render();
  let resolve!: (value: unknown) => void;
  fetchMock.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  await type("İlk mətn");
  await tick(901);
  expect(container.textContent).toContain("Saxlanır");
  expect(container.textContent).not.toContain("Saxlandı");
  await type("Daha yeni mətn");
  state.revision++;
  state.unlockedStages[0].acceptedAnswer = "İlk mətn";
  state.unlockedStages[0].savedAt = new Date().toISOString();
  await act(async () => resolve(response({ session: structuredClone(state) })));
  expect(answer().value).toBe("Daha yeni mətn");
  expect(container.textContent).toContain("Saxlanmadı");
});
it("retries uncertain network writes with the same requestId and payload", async () => {
  await render();
  fetchMock.mockRejectedValueOnce(new TypeError("offline"));
  await type("Qorunan qaralama");
  await tick(901);
  const original = JSON.parse(fetchMock.mock.calls[1][1].body);
  expect(answer().value).toBe("Qorunan qaralama");
  expect(container.textContent).toContain("Saxlanmadı");
  state.revision++;
  state.unlockedStages[0].acceptedAnswer = original.answer;
  state.unlockedStages[0].savedAt = new Date().toISOString();
  await click("Təkrar cəhd");
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual(original);
  expect(container.textContent).toContain("Saxlandı");
});
it("keeps local text beside the server answer on 409 and does not advance", async () => {
  await render();
  await type("Mənim cavabım");
  fetchMock.mockResolvedValueOnce(
    response({ error: "Versiya dəyişib", code: "REVISION_CONFLICT" }, 409),
  );
  state.revision++;
  state.unlockedStages[0].acceptedAnswer = "Başqa tabın cavabı";
  await click("Cavabı qəbul et");
  expect(answer().value).toBe("Mənim cavabım");
  expect(container.textContent).toContain("Başqa tabın cavabı");
  expect(container.textContent).toContain("Mərhələ 1 / 3");
  const count = fetchMock.mock.calls.length;
  await tick(2000);
  expect(fetchMock.mock.calls).toHaveLength(count);
});
it("refreshes accepted text from another tab without autosaving the old text over it", async () => {
  await render();
  state.revision++;
  state.unlockedStages[0].acceptedAnswer = "Başqa tabda saxlanıb";
  state.unlockedStages[0].savedAt = new Date().toISOString();
  await tick(10001);
  expect(answer().value).toBe("Başqa tabda saxlanıb");
  await tick(1000);
  expect(fetchMock.mock.calls).toHaveLength(2);
});
it("does not show one candidate's invitation when HR changes candidate", async () => {
  const props = {
    vacancyId: crypto.randomUUID(),
    candidateId: crypto.randomUUID(),
    workspaceRevision: 1,
    approved: true,
  };
  fetchMock.mockResolvedValue(
    response({
      invitationId: crypto.randomUUID(),
      invitationExpiresAt: new Date().toISOString(),
      url: "https://example.test/candidate/first#secret",
      replayed: false,
    }),
  );
  await act(async () =>
    root.render(createElement(CandidateInvitationControl, props)),
  );
  await click("Namizəd keçidi yarat");
  expect(container.querySelector("input")?.value).toContain("/first#");
  await act(async () =>
    root.render(
      createElement(CandidateInvitationControl, {
        ...props,
        candidateId: crypto.randomUUID(),
      }),
    ),
  );
  expect(container.querySelector("input")).toBeNull();
});
it("locks the editor when polling confirms revocation", async () => {
  await render();
  fetchMock.mockResolvedValueOnce(
    response({ error: "Dəvət ləğv edilib.", code: "REVOKED" }, 410),
  );
  await tick(10001);
  expect(answer().readOnly).toBe(true);
  expect(container.textContent).toContain("Dəvət ləğv edilib");
});
