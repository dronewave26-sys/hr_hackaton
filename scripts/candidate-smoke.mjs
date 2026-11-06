// Real HTTP test with isolated demo cookies; does not reset any .data files.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { setTimeout as pause } from "node:timers/promises";
const port = Number(process.env.CANDIDATE_TEST_PORT || 3193);
const base = `http://127.0.0.1:${port}`;
// Refuse to accidentally use an existing server.
try {
  await fetch(base, { signal: AbortSignal.timeout(500) });
  throw new Error("Test port is already occupied");
} catch (error) {
  if (error.message === "Test port is already occupied") throw error;
}
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    env: {
      ...process.env,
      LOCAL_DEMO_MODE: "true",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      SUPABASE_SECRET_KEY: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
const stopped = once(server, "exit");
let logs = "";
for (const stream of [server.stdout, server.stderr])
  stream.on("data", (chunk) => {
    logs = (logs + chunk).slice(-3000);
  });
function browser() {
  let cookies = new Map();
  return async (path, body, expected = 200, extra = {}) => {
    const response = await fetch(base + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        cookie: [...cookies]
          .map(([key, value]) => `${key}=${value}`)
          .join("; "),
        ...(body === undefined
          ? {}
          : { origin: base, "content-type": "application/json" }),
        ...extra,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const line of response.headers.getSetCookie()) {
      const pair = line.split(";")[0],
        at = pair.indexOf("=");
      cookies.set(pair.slice(0, at), pair.slice(at + 1));
    }
    const data = await response.json();
    assert.equal(
      response.status,
      expected,
      `${path}: ${data.error ?? "unexpected status"}`,
    );
    assert.match(response.headers.get("cache-control"), /no-store/);
    return data;
  };
}
const hr = browser(),
  outsider = browser();
const ids = [];
try {
  let ready = false;
  for (let i = 0; i < 100 && server.exitCode === null; i++) {
    try {
      if ((await fetch(base)).ok) {
        ready = true;
        break;
      }
    } catch {
      /* startup */
    }
    await pause(300);
  }
  assert.ok(ready, logs);
  let { workspace } = await hr("/api/workspace");
  ({ workspace } = await hr("/api/workspace", {
    type: "seed",
    revision: workspace.revision,
  }));
  const titles = [];
  for (let index = 0; index < 2; index++) {
    let vacancy = workspace.vacancies[index];
    const input = {
      vacancyId: vacancy.id,
      candidateId: vacancy.candidates[0].id,
      workspaceRevision: workspace.revision,
      requestId: randomUUID(),
    };
    await hr("/api/candidate-invitations", input, 409);
    ({ workspace } = await hr("/api/workspace", {
      type: "saveAssessment",
      vacancyId: vacancy.id,
      revision: workspace.revision,
      assessment: vacancy.assessment,
      approve: true,
    }));
    vacancy = workspace.vacancies[index];
    input.workspaceRevision = workspace.revision;
    await hr(
      "/api/candidate-invitations",
      {
        ...input,
        candidateId: workspace.vacancies[1 - index].candidates[0].id,
      },
      404,
    );
    await hr("/api/candidate-invitations", input, 403, {
      origin: "https://wrong.example",
    });
    const invite = await hr("/api/candidate-invitations", input);
    const html = await (
      await fetch(base + `/candidate/${invite.invitationId}`)
    ).text();
    assert.ok(!html.includes(vacancy.assessment.stages[2]));
    assert.ok(!html.includes(vacancy.candidates[0].cv));
    ids.push(invite.invitationId);
    const repeat = await hr("/api/candidate-invitations", input);
    assert.equal(repeat.url, null);
    assert.equal(repeat.invitationId, invite.invitationId);
    await outsider(
      `/api/candidate-invitations/${invite.invitationId}`,
      undefined,
      404,
    );
    const candidate = browser();
    const fragment = new URL(invite.url).hash.slice(1);
    await candidate(
      "/api/candidate/exchange",
      { invitationId: invite.invitationId, secret: "0".repeat(64) },
      410,
    );
    let { session } = await candidate("/api/candidate/exchange", {
      invitationId: invite.invitationId,
      secret: fragment,
    });
    titles.push(session.vacancyTitle);
    assert.deepEqual(session.unlockedStages, []);
    assert.equal(session.materials, null);
    assert.equal(session.expiresAt, null);
    const anonymousWorkspace = await candidate("/api/workspace");
    assert.equal(anonymousWorkspace.workspace.vacancies.length, 0);
    await candidate(
      `/api/candidate-invitations/${invite.invitationId}`,
      undefined,
      404,
    );
    const mutation = (type, more = {}) => ({
      invitationId: invite.invitationId,
      type,
      requestId: randomUUID(),
      revision: session.revision,
      ...more,
    });
    const start = mutation("start");
    ({ session } = await candidate("/api/candidate/session", start));
    const expiresAt = session.expiresAt;
    ({ session } = await candidate("/api/candidate/session", start));
    assert.equal(session.expiresAt, expiresAt);
    assert.equal(session.unlockedStages.length, 1);
    assert.equal(session.materials, vacancy.assessment.materials);
    assert.ok(!JSON.stringify(session).includes(vacancy.assessment.stages[2]));
    await candidate(
      `/api/candidate/session?invitationId=${randomUUID()}`,
      undefined,
      401,
    );
    const first = mutation("save", { stage: 1, answer: "Birinci cavab" });
    const concurrent = await Promise.allSettled([
      candidate("/api/candidate/session", first),
      candidate(
        "/api/candidate/session",
        { ...first, requestId: randomUUID(), answer: "Paralel qaralama" },
        409,
      ),
    ]);
    assert.ok(concurrent.every((result) => result.status === "fulfilled"));
    ({ session } = await candidate(
      `/api/candidate/session?invitationId=${invite.invitationId}`,
    ));
    assert.equal(session.unlockedStages[0].acceptedAnswer, "Birinci cavab");
    assert.equal(session.expiresAt, expiresAt);
    await candidate(
      "/api/candidate/session",
      mutation("save", { stage: 3, answer: "future" }),
      409,
    );
    ({ session } = await candidate(
      "/api/candidate/session",
      mutation("advance", { stage: 1, answer: "Birinci yekun" }),
    ));
    await candidate(
      "/api/candidate/session",
      mutation("save", { stage: 1, answer: "locked" }),
      409,
    );
    ({ session } = await candidate(
      "/api/candidate/session",
      mutation("advance", { stage: 2, answer: "İkinci cavab" }),
    ));
    const submit = mutation("submit", { stage: 3, answer: "Əsaslandırma" });
    ({ session } = await candidate("/api/candidate/session", submit));
    const completedAt = session.completedAt;
    ({ session } = await candidate("/api/candidate/session", submit));
    assert.equal(session.completedAt, completedAt);
    assert.equal(session.status, "submitted");
    await candidate(
      "/api/candidate/session",
      mutation("save", { stage: 3, answer: "late" }),
      409,
    );
    const detail = await hr(
      `/api/candidate-invitations/${invite.invitationId}`,
    );
    assert.equal(detail.invitation.candidateId, vacancy.candidates[0].id);
    assert.equal(
      detail.invitation.unlockedStages[2].acceptedAnswer,
      "Əsaslandırma",
    );
    assert.ok(!JSON.stringify(detail).includes(fragment));
    assert.ok(!JSON.stringify(detail).includes("secretHash"));
    const original = structuredClone(vacancy.assessment);
    ({ workspace } = await hr("/api/workspace", {
      type: "saveAssessment",
      vacancyId: vacancy.id,
      revision: workspace.revision,
      assessment: {
        ...original,
        stages: ["Redaktə olunmuş sınaq", ...original.stages.slice(1)],
      },
      approve: false,
    }));
    assert.deepEqual(
      (await hr(`/api/candidate-invitations/${invite.invitationId}`)).invitation
        .assessment,
      original,
    );
    await hr(`/api/candidate-invitations/${invite.invitationId}/revoke`, {});
    await candidate(
      `/api/candidate/session?invitationId=${invite.invitationId}`,
      undefined,
      410,
    );
    await candidate(
      "/api/candidate/exchange",
      { invitationId: invite.invitationId, secret: fragment },
      410,
    );
  }
  assert.notEqual(titles[0], titles[1]);
  const rateClient = browser(),
    unknownId = randomUUID();
  for (let attempt = 0; attempt < 21; attempt++) {
    await rateClient(
      "/api/candidate/exchange",
      { invitationId: unknownId, secret: "1".repeat(64) },
      attempt < 20 ? 404 : 429,
    );
  }
  const wrongType = await fetch(base + "/api/candidate/exchange", {
    method: "POST",
    headers: { origin: base, "content-type": "text/plain" },
    body: "{}",
  });
  assert.equal(wrongType.status, 415);
  console.log(
    "Candidate HTTP: sales + SOC, isolation, approval, snapshot, timer, CAS, retries, locked stages, submission and revocation passed.",
  );
} finally {
  for (const id of ids) {
    try {
      await hr(`/api/candidate-invitations/${id}/revoke`, {});
    } catch {
      /* server failure */
    }
  }
  if (server.exitCode === null) server.kill("SIGTERM");
  await stopped;
}
