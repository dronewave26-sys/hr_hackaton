// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PracticalResults } from "@/components/practical-results";
import { createFixtures } from "@/lib/fixtures";
import type { Vacancy } from "@/lib/domain";
import type { PracticalReport } from "@/lib/reports/contracts";

type Detail = {
  invitationId: string;
  vacancyId: string;
  candidateId: string;
  sessionId: string;
  snapshotId: string;
  status: "submitted";
  completedAt: string;
  revision: number;
  vacancyTitle: string;
  durationMinutes: number;
  serverNow: string;
  startedAt: string;
  expiresAt: string;
  invitationExpiresAt: string;
  currentStage: 3;
  materials: string;
  assessment: NonNullable<Vacancy["assessment"]>;
  unlockedStages: {
    stage: 1 | 2 | 3;
    prompt: string;
    acceptedAnswer: string;
    savedAt: string;
    locked: boolean;
  }[];
};
type MockResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};
const response = (data: unknown, status = 200): MockResponse => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => structuredClone(data),
});

let root: Root;
let container: HTMLDivElement;
let jobs: Vacancy[];
let records: Detail[];
let aiReady: boolean;
let savedReport: PracticalReport | null;
let reportFailure: boolean;
let requests: { url: string; method: string; body?: string }[];
let fetchMock: ReturnType<typeof vi.fn>;

function detail(job: Vacancy, prefix: string): Detail {
  const now = "2026-11-06T12:00:00.000Z";
  return {
    invitationId: crypto.randomUUID(),
    vacancyId: job.id,
    candidateId: job.candidates[0].id,
    sessionId: crypto.randomUUID(),
    snapshotId: crypto.randomUUID(),
    status: "submitted",
    completedAt: now,
    revision: 8,
    vacancyTitle: job.title,
    durationMinutes: 13,
    serverNow: now,
    startedAt: "2026-11-06T11:50:00.000Z",
    expiresAt: "2026-11-06T12:03:00.000Z",
    invitationExpiresAt: "2026-11-07T12:00:00.000Z",
    currentStage: 3,
    materials: job.assessment!.materials,
    assessment: job.assessment!,
    unlockedStages: job.assessment!.stages.map((prompt, index) => ({
      stage: (index + 1) as 1 | 2 | 3,
      prompt,
      acceptedAnswer: `${prefix} qəbul edilmiş cavab ${index + 1}`,
      savedAt: now,
      locked: true,
    })),
  };
}

function generatedReport(): PracticalReport {
  return {
    source: "claude",
    model: "test-model",
    createdAt: "2026-11-06T12:01:00.000Z",
    summary: "Namizəd cavabını məhsul göstəriciləri ilə əsaslandırıb.",
    criteria: [
      {
        criterion: "Ehtiyac və ilkin müqayisə",
        level: "demonstrated",
        evidence: [
          { stage: 1, quote: records[0].unlockedStages[0].acceptedAnswer },
        ],
        reason: "Qərar təqdim edilən materiala bağlanıb.",
        question: "Büdcə yenidən azalsa hansı tələbi dəqiqləşdirərdin?",
      },
    ],
    limitations: ["Real müştəri ilə danışıqlar bu cavabda yoxlanmayıb."],
  };
}

async function baseFetch(
  input: string,
  init?: RequestInit,
): Promise<MockResponse> {
  const url = new URL(input, "http://localhost");
  const method = init?.method ?? "GET";
  requests.push({ url: input, method, body: init?.body as string | undefined });
  if (url.pathname === "/api/candidate-invitations") {
    return response({
      invitations: records
        .filter(
          (record) =>
            record.vacancyId === url.searchParams.get("vacancyId") &&
            record.candidateId === url.searchParams.get("candidateId"),
        )
        .map(({ invitationId, status, completedAt, revision }) => ({
          invitationId,
          status,
          completedAt,
          revision,
        })),
    });
  }
  const record = records.find((item) =>
    url.pathname.includes(item.invitationId),
  );
  if (!record) throw new Error(`Unexpected endpoint: ${input}`);
  if (url.pathname.endsWith("/report")) {
    if (reportFailure)
      return response({ error: "Claude bağlantısı müvəqqəti alınmadı." }, 502);
    if (method === "POST") savedReport = generatedReport();
    return response({ report: savedReport, aiReady });
  }
  return response({ invitation: record });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  jobs = createFixtures();
  records = [detail(jobs[0], "Satış"), detail(jobs[1], "SOC")];
  aiReady = false;
  savedReport = null;
  reportFailure = false;
  requests = [];
  fetchMock = vi.fn(baseFetch);
  vi.stubGlobal("fetch", fetchMock);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
async function render(job = jobs[0]) {
  await act(async () =>
    root.render(
      createElement(PracticalResults, {
        vacancyId: job.id,
        candidateId: job.candidates[0].id,
      }),
    ),
  );
}
function button(text: string) {
  const control = [...container.querySelectorAll("button")].find((item) =>
    item.textContent?.includes(text),
  );
  expect(control, `Missing button: ${text}`).toBeTruthy();
  return control!;
}

it("shows accepted answers and the frozen assessment even when Claude is not configured", async () => {
  await render();
  for (const stage of records[0].unlockedStages)
    expect(container.textContent).toContain(stage.acceptedAnswer);
  expect(container.textContent).toContain(jobs[0].assessment!.materials);
  expect(container.textContent).toContain("Claude bağlantısı qurulmayıb");
  expect(button("Claude hesabatını hazırla").disabled).toBe(true);
  expect(requests.every((request) => request.method === "GET")).toBe(true);
  expect(container.textContent).not.toContain("100/100");
});

it("isolates sales and SOC selection and ignores a late response for the previous candidate", async () => {
  let release: ((value: MockResponse) => void) | undefined;
  let oldSignal: AbortSignal | undefined;
  const lateResponse = new Promise<MockResponse>((resolve) => {
    release = resolve;
  });
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    if (url === `/api/candidate-invitations/${records[0].invitationId}`) {
      oldSignal = init?.signal ?? undefined;
      return lateResponse;
    }
    return baseFetch(url, init);
  });
  await render(jobs[0]);
  expect(oldSignal?.aborted).toBe(false);
  await render(jobs[1]);
  expect(oldSignal?.aborted).toBe(true);
  for (const stage of records[1].unlockedStages)
    expect(container.textContent).toContain(stage.acceptedAnswer);
  expect(container.textContent).not.toContain("Satış qəbul edilmiş cavab");
  await act(async () => release!(response({ invitation: records[0] })));
  expect(container.textContent).toContain("SOC qəbul edilmiş cavab 1");
  expect(container.textContent).not.toContain("Satış qəbul edilmiş cavab");
  const lists = requests.filter(({ url }) =>
    url.startsWith("/api/candidate-invitations?"),
  );
  expect(lists).toHaveLength(2);
  expect(lists[1].url).toContain(`candidateId=${jobs[1].candidates[0].id}`);
});

it("renders generated report evidence and reloads the saved report without generating again", async () => {
  aiReady = true;
  await render();
  expect(button("Claude hesabatını hazırla").disabled).toBe(false);
  await act(async () => button("Claude hesabatını hazırla").click());
  expect(requests.filter(({ method }) => method === "POST")).toEqual([
    {
      url: `/api/candidate-invitations/${records[0].invitationId}/report`,
      method: "POST",
      body: "{}",
    },
  ]);
  expect(container.textContent).toContain("Claude · saxlanmış qiymətləndirmə");
  expect(container.textContent).toContain("Ehtiyac və ilkin müqayisə");
  expect(container.textContent).toContain("Cavabda göstərilib");
  expect(container.querySelector("blockquote")?.textContent).toContain(
    records[0].unlockedStages[0].acceptedAnswer,
  );
  expect(container.textContent).toContain(
    "Büdcə yenidən azalsa hansı tələbi dəqiqləşdirərdin?",
  );
  expect(container.textContent).toContain(
    "Real müştəri ilə danışıqlar bu cavabda yoxlanmayıb.",
  );
  await act(async () => root.render(null));
  await render();
  expect(container.textContent).toContain("Claude · saxlanmış qiymətləndirmə");
  expect(requests.filter(({ method }) => method === "POST")).toHaveLength(1);
  expect(container.textContent).toContain("son qərar HR-də qalır");
});

it("keeps accepted answers visible when the report endpoint fails and allows refresh", async () => {
  reportFailure = true;
  await render();
  expect(container.textContent).toContain("Satış qəbul edilmiş cavab 1");
  expect(container.textContent).toContain(
    "Claude bağlantısı müvəqqəti alınmadı.",
  );
  reportFailure = false;
  await act(async () => button("Yenilə").click());
  expect(container.textContent).not.toContain(
    "Claude bağlantısı müvəqqəti alınmadı.",
  );
  expect(container.textContent).toContain("Satış qəbul edilmiş cavab 1");
  expect(container.textContent).toContain("Claude bağlantısı qurulmayıb");
});
