import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createFixtures } from "../../src/lib/fixtures";
import {
  createRecord,
  type RecordData,
} from "../../src/lib/server/candidate/model";
import { AppError } from "../../src/lib/server/errors";
import { reportBinding } from "../../src/lib/server/reports/model";
import type { PracticalReport } from "../../src/lib/reports/contracts";

const mocks = vi.hoisted(() => ({
  owner: vi.fn(),
  list: vi.fn(),
  record: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  generate: vi.fn(),
  ready: vi.fn(),
  origin: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/context", () => ({ requireSameOrigin: mocks.origin }));
vi.mock("@/lib/server/reports/access", () => ({
  reportOwner: mocks.owner,
  ownedInvitationList: mocks.list,
  ownedRecord: mocks.record,
}));
vi.mock("@/lib/server/reports/store", () => ({
  practicalReportStore: () => ({ get: mocks.get, put: mocks.put }),
}));
vi.mock("@/lib/server/reports/claude", () => ({
  generatePracticalReport: mocks.generate,
  reportAIReady: mocks.ready,
}));
import {
  listInvitations,
  practicalReport,
} from "../../src/lib/server/reports/handlers";

let record: RecordData;
let report: PracticalReport;
const request = (write = false, body = {}) =>
  new NextRequest(
    "http://localhost/api/candidate-invitations/report",
    write
      ? {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost",
          },
          body: JSON.stringify(body),
        }
      : {},
  );
beforeEach(() => {
  vi.clearAllMocks();
  const vacancy = createFixtures()[0];
  vacancy.assessment!.approvedAt = new Date().toISOString();
  record = createRecord(
    crypto.randomUUID(),
    {
      vacancyId: vacancy.id,
      candidateId: vacancy.candidates[0].id,
      requestId: crypto.randomUUID(),
      workspaceRevision: 1,
    },
    { revision: 1, vacancies: [vacancy] },
    Date.now(),
  ).record;
  record.status = "submitted";
  record.completedAt = new Date().toISOString();
  record.answers[0] = {
    answer: "P3 üçün 2880 AZN.",
    savedAt: new Date().toISOString(),
  };
  report = {
    source: "claude",
    model: "test",
    createdAt: new Date().toISOString(),
    summary: "İlkin qiymətləndirmə",
    limitations: ["İnsan baxışı tələb olunur."],
    criteria: record.assessment.criteria.map((criterion) => ({
      criterion,
      level: "partial",
      evidence: [{ stage: 1, quote: "P3 üçün 2880 AZN." }],
      reason: "Qismən müşahidə var.",
      question: "Qərarını izah et.",
    })),
  };
  mocks.owner.mockResolvedValue({ owner: record.owner, storage: "local" });
  mocks.record.mockImplementation(async () => structuredClone(record));
  mocks.get.mockResolvedValue(null);
  mocks.put.mockImplementation(async (envelope) => envelope);
  mocks.generate.mockImplementation(async () => structuredClone(report));
  mocks.ready.mockReturnValue(false);
  mocks.origin.mockImplementation(() => {});
});

describe("owned practical report routes", () => {
  it("returns null/aiReadyfalse without generating fake output", async () => {
    const response = await practicalReport(request(), record.id);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ report: null, aiReady: false });
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("rejects foreign invitation access before report storage or generation", async () => {
    mocks.record.mockRejectedValue(new AppError("Dəvət tapılmadı.", 404));
    expect((await practicalReport(request(true), record.id, true)).status).toBe(
      404,
    );
    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("rejects active/revoked sessions without generating", async () => {
    record.status = "active";
    expect((await practicalReport(request(true), record.id, true)).status).toBe(
      409,
    );
    record.status = "revoked";
    expect((await practicalReport(request(true), record.id, true)).status).toBe(
      409,
    );
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("returns503 when Claude configuration is absent and preserves records", async () => {
    mocks.generate.mockRejectedValue(
      new AppError("Claude konfiqurasiyasını qurun.", 503),
    );
    const before = structuredClone(record);
    expect((await practicalReport(request(true), record.id, true)).status).toBe(
      503,
    );
    expect(record).toEqual(before);
    expect(mocks.put).not.toHaveBeenCalled();
  });
  it("validates origin and empty JSON POST body", async () => {
    expect(
      (
        await practicalReport(
          request(true, { level: "demonstrated" }),
          record.id,
          true,
        )
      ).status,
    ).toBe(400);
    mocks.origin.mockImplementation(() => {
      throw new AppError("Forbidden", 403);
    });
    expect((await practicalReport(request(true), record.id, true)).status).toBe(
      403,
    );
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("caches a report with server-selected session/snapshot identity", async () => {
    const response = await practicalReport(request(true), record.id, true);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ report, aiReady: false });
    expect(mocks.put.mock.calls[0][0]).toMatchObject({
      owner: record.owner,
      invitationId: record.id,
      snapshotId: record.snapshotId,
      sessionId: record.sessionId,
      binding: reportBinding(record),
    });
  });
  it("returns immutable cached content even when model configuration was removed", async () => {
    mocks.get.mockResolvedValue({
      owner: record.owner,
      invitationId: record.id,
      snapshotId: record.snapshotId,
      sessionId: record.sessionId,
      binding: reportBinding(record),
      report,
    });
    const response = await practicalReport(request(true), record.id, true);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ report, aiReady: false });
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.put).not.toHaveBeenCalled();
  });
  it("rejects changed final answers during the model request", async () => {
    mocks.generate.mockImplementation(async () => {
      record.answers[0].answer += "changed";
      return report;
    });
    expect((await practicalReport(request(true), record.id, true)).status).toBe(
      409,
    );
    expect(mocks.put).not.toHaveBeenCalled();
  });
});

describe("invitation collection route", () => {
  it("passes only verified owner and validated IDs to listing", async () => {
    const expected = [
      {
        invitationId: record.id,
        status: "submitted",
        completedAt: record.completedAt,
        revision: 1,
      },
    ];
    mocks.list.mockResolvedValue(expected);
    const req = new NextRequest(
      `http://localhost/api/candidate-invitations?vacancyId=${record.createRequest.vacancyId}&candidateId=${record.createRequest.candidateId}`,
    );
    const response = await listInvitations(req);
    expect(await response.json()).toEqual({ invitations: expected });
    expect(mocks.list).toHaveBeenCalledWith(
      req,
      record.owner,
      "local",
      record.createRequest.vacancyId,
      record.createRequest.candidateId,
    );
  });
  it("rejects invalid IDs without calling list storage", async () => {
    expect(
      (
        await listInvitations(
          new NextRequest(
            "http://localhost/api/candidate-invitations?vacancyId=wrong",
          ),
        )
      ).status,
    ).toBe(400);
    expect(mocks.list).not.toHaveBeenCalled();
  });
});
