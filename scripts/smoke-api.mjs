// Run against the owned local server: npm run dev, then npm run test:api.
import assert from "node:assert/strict";

const base = process.env.SKILLPROOF_TEST_URL || "http://127.0.0.1:3000";
const url = new URL(base);
if (!["localhost", "127.0.0.1"].includes(url.hostname))
  throw new Error("Smoke test is restricted to localhost.");
let cookie = "";
let workspace;
const request = async (action, options = {}) => {
  const response = await fetch(`${base}/api/workspace`, {
    method: action ? "POST" : "GET",
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(action ? { Origin: base, "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    ...(action
      ? { body: JSON.stringify({ ...action, revision: workspace.revision }) }
      : {}),
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const body = await response.json();
  return { response, body };
};
const update = async (action) => {
  const { response, body } = await request(action);
  assert.equal(response.status, 200, body.error);
  workspace = body.workspace;
  return body;
};

const initial = await request();
assert.equal(initial.response.status, 200, initial.body.error);
assert.equal(
  initial.body.config.storage,
  "local",
  "Smoke test expects isolated local demo mode, not real HR data.",
);
workspace = initial.body.workspace;
assert.equal(
  workspace.vacancies.length,
  0,
  "Fresh demo cookie must not see another browser's workspace.",
);

await update({ type: "seed" });
assert.equal(workspace.vacancies.length, 2);
const seededIds = workspace.vacancies.map((job) => job.id);
await update({ type: "seed" });
assert.deepEqual(
  workspace.vacancies.map((job) => job.id),
  seededIds,
  "Repeated seeding must not duplicate examples.",
);

const sales = workspace.vacancies.find((job) => job.demoKey === "sales");
const soc = workspace.vacancies.find((job) => job.demoKey === "soc");
assert.notEqual(sales.id, soc.id);
assert.notEqual(sales.title, soc.title);
assert.notEqual(sales.assessment.materials, soc.assessment.materials);
assert.equal(
  new Set([...sales.candidates, ...soc.candidates].map((person) => person.id))
    .size,
  4,
);
assert.ok(
  sales.candidates.every((person) => person.demoKey.startsWith("sales-")),
);
assert.ok(soc.candidates.every((person) => person.demoKey.startsWith("soc-")));
await update({
  type: "analyze",
  vacancyId: sales.id,
  candidateId: sales.candidates[0].id,
  mode: "demo",
});
const report = workspace.vacancies.find((job) => job.id === sales.id)
  .candidates[0].analysis;
assert.equal(report.source, "saved-demo");
assert.equal(report.items.length, sales.skills.length);
for (const item of report.items)
  if (item.quote) assert.ok(sales.candidates[0].cv.includes(item.quote));

await update({
  type: "create",
  title: "İnteqrasiya demo vakansiyası",
  department: "Test",
  description:
    "Bu, saxlama və giriş sərhədlərini yoxlamaq üçün uydurma vakansiyadır.",
  skills: ["Mənbəni əsaslandırmaq"],
});
const custom = workspace.vacancies[0];
await update({
  type: "addCandidate",
  vacancyId: custom.id,
  name: "Uydurma inteqrasiya namizədi",
  cv: "Bu CV yalnız inteqrasiya yoxlaması üçün uydurulub. Mənbəyə əsaslanan təkliflər hazırlamışam.",
});
const person = workspace.vacancies[0].candidates[0];
const noPreset = await request({
  type: "analyze",
  vacancyId: custom.id,
  candidateId: person.id,
  mode: "demo",
});
assert.notEqual(
  noPreset.response.status,
  200,
  "New CV cannot borrow a saved demo report.",
);

const assessment = {
  materials: "Uydurma yoxlama materialı.",
  stages: [
    "İlkin qərarını yaz.",
    "Yeni şərtə uyğunlaşdır.",
    "Qərarını sübutla əsaslandır.",
  ],
  duration: 13,
  criteria: ["Sübutdan istifadə"],
};
await update({
  type: "saveAssessment",
  vacancyId: custom.id,
  assessment,
  approve: true,
});
assert.ok(workspace.vacancies[0].assessment.approvedAt);
await update({
  type: "saveAssessment",
  vacancyId: custom.id,
  assessment: { ...assessment, duration: 15 },
  approve: false,
});
assert.equal(
  workspace.vacancies[0].assessment.approvedAt,
  undefined,
  "Edited draft must lose its approval.",
);

const previousRevision = workspace.revision;
const reload = await request();
assert.equal(reload.body.workspace.revision, previousRevision);
assert.equal(reload.body.workspace.vacancies[0].candidates[0].cv, person.cv);
const wrongOrigin = await request(
  { type: "seed" },
  { headers: { Origin: "https://unrelated.example" } },
);
assert.equal(wrongOrigin.response.status, 403);
const staleResponse = await fetch(`${base}/api/workspace`, {
  method: "POST",
  headers: { Cookie: cookie, Origin: base, "Content-Type": "application/json" },
  body: JSON.stringify({ type: "seed", revision: previousRevision - 1 }),
});
assert.equal(staleResponse.status, 409);
const stranger = await fetch(`${base}/api/workspace`);
const strangerBody = await stranger.json();
assert.equal(strangerBody.workspace.vacancies.length, 0);

console.log(
  "PASS: demo isolation, repeat seeding, quoted evidence, new vacancy/CV persistence, approval reset, origin and revision guards.",
);
console.log(
  "This checks the local HR milestone; it does not validate real Supabase/Claude or candidate sessions.",
);
