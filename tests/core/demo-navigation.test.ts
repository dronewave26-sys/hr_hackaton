// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { WorkspaceApp } from "../../src/components/workspace-app";
import { createFixtures } from "../../src/lib/fixtures";
import type { Workspace } from "../../src/lib/domain";

let root: Root;
let container: HTMLDivElement;
let workspace: Workspace;
let requests: string[];

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  workspace = { revision: 1, vacancies: createFixtures().reverse() };
  requests = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        const action = JSON.parse(String(init.body));
        requests.push(action.type);
        if (action.type === "seed") {
          for (const fixture of createFixtures()) {
            if (
              !workspace.vacancies.some(
                (job) => job.demoKey === fixture.demoKey,
              )
            ) {
              workspace.vacancies.push(fixture);
            }
          }
          workspace.revision++;
        }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          workspace: structuredClone(workspace),
          config: { storage: "local", aiReady: false, account: "Lokal demo" },
        }),
      };
    }),
  );
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

async function render() {
  await act(async () => root.render(createElement(WorkspaceApp)));
}

async function click(text: string, selector = "button") {
  const button = Array.from(
    container.querySelectorAll<HTMLButtonElement>(selector),
  ).find((item) => item.textContent?.includes(text));
  expect(button, `Missing control: ${text}`).toBeTruthy();
  await act(async () => button!.click());
}

function expectVacancy(key: "sales" | "soc") {
  const job = workspace.vacancies.find((item) => item.demoKey === key)!;
  const other = workspace.vacancies.find((item) => item.demoKey !== key);
  expect(container.querySelector("h1")?.textContent).toBe(job.title);
  expect(
    container.querySelector(".cv-text")?.textContent ?? container.textContent,
  ).toContain(job.candidates[0].cv);
  if (other)
    expect(container.textContent).not.toContain(other.candidates[0].name);
}

async function expectAssessment(key: "sales" | "soc") {
  await click("Sınaq layihəsi", '[role="tab"]');
  const values = Array.from(container.querySelectorAll("textarea")).map(
    (item) => item.value,
  );
  const assessment = workspace.vacancies.find(
    (item) => item.demoKey === key,
  )!.assessment!;
  expect(values).toContain(assessment.materials);
  for (const stage of assessment.stages) expect(values).toContain(stage);
}

it("opens distinct titles, CVs and assessment materials from each vacancy row", async () => {
  await render();
  await click("B2B satış məsləhətçisi", ".vacancy-row");
  expectVacancy("sales");
  await expectAssessment("sales");
  await click("Vakansiyalara qayıt");
  await click("SOC analitiki", ".vacancy-row");
  expectVacancy("soc");
  await expectAssessment("soc");
  expect(requests).toEqual([]);
});

it.each([
  ["sales", "Satış nümunəsini aç"],
  ["soc", "SOC nümunəsini aç"],
] as const)(
  "opens the existing %s demo directly without reseeding",
  async (key, label) => {
    await render();
    await click(label);
    expectVacancy(key);
    await expectAssessment(key);
    expect(requests).toEqual([]);
  },
);

it.each([
  ["sales", "Satış nümunəsini aç"],
  ["soc", "SOC nümunəsini aç"],
] as const)(
  "loads missing fixtures then opens the chosen %s demo",
  async (key, label) => {
    workspace = { revision: 0, vacancies: [] };
    await render();
    await click(label);
    expectVacancy(key);
    await expectAssessment(key);
    expect(requests).toEqual(["seed"]);
    await click("Vakansiyalara qayıt");
    await click(label);
    expectVacancy(key);
    expect(requests).toEqual(["seed"]);
  },
);
