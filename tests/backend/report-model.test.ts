import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createFixtures } from "../../src/lib/fixtures";
import { createRecord } from "../../src/lib/server/candidate/model";
import {
  reportBinding,
  terminalSnapshot,
  validateReportContent,
  verifyCached,
} from "../../src/lib/server/reports/model";
import type { PracticalReportContent } from "../../src/lib/reports/contracts";

function sample() {
  const vacancy = createFixtures()[0];
  vacancy.assessment!.approvedAt = new Date().toISOString();
  const { record } = createRecord(
    crypto.randomUUID(),
    {
      requestId: crypto.randomUUID(),
      vacancyId: vacancy.id,
      candidateId: vacancy.candidates[0].id,
      workspaceRevision: 1,
    },
    { revision: 1, vacancies: [vacancy] },
    Date.now(),
  );
  record.status = "submitted";
  record.completedAt = new Date().toISOString();
  record.answers[0] = {
    answer: "P3 üçün 2880 AZN. Batareya 8 saatdır.",
    savedAt: new Date().toISOString(),
  };
  const content: PracticalReportContent = {
    summary: "Sübutlu ilkin müşahidə.",
    limitations: ["Canlı yoxlama tələb olunur."],
    criteria: record.assessment.criteria.map((criterion) => ({
      criterion,
      level: "demonstrated",
      evidence: [{ stage: 1, quote: "P3 üçün 2880 AZN." }],
      reason: "Cavabdakı konkret məlumat.",
      question: "Qərarını izah et.",
    })),
  };
  return { record, content };
}

describe("practical report evidence boundary", () => {
  it("accepts exact stage evidence and restores HR criterion order", () => {
    const { record, content } = sample();
    content.criteria.reverse();
    expect(
      validateReportContent(content, record).criteria.map(
        (item) => item.criterion,
      ),
    ).toEqual(record.assessment.criteria);
  });
  it("requires terminal completion, not an active or revoked session", () => {
    const { record } = sample();
    record.status = "active";
    expect(() => terminalSnapshot(record)).toThrow();
    record.status = "revoked";
    expect(() => terminalSnapshot(record)).toThrow();
    record.status = "expired";
    expect(() => terminalSnapshot(record)).not.toThrow();
  });
  it("rejects duplicate legacy criteria before requesting AI evaluation", () => {
    const { record } = sample();
    record.assessment.criteria[1] = record.assessment.criteria[0];
    expect(() => terminalSnapshot(record)).toThrow("təkrarlanan meyar");
  });
  it("rejects missing, duplicated and unknown criteria", () => {
    const { record, content } = sample();
    expect(() =>
      validateReportContent(
        { ...content, criteria: content.criteria.slice(1) },
        record,
      ),
    ).toThrow();
    content.criteria[1].criterion = content.criteria[0].criterion;
    expect(() => validateReportContent(content, record)).toThrow();
    content.criteria[1].criterion = "Unapproved criterion";
    expect(() => validateReportContent(content, record)).toThrow();
  });
  it("rejects fabricated quotes and quotes assigned to another stage", () => {
    const { record, content } = sample();
    content.criteria[0].evidence[0].quote = "Mənbədə yoxdur";
    expect(() => validateReportContent(content, record)).toThrow();
    content.criteria[0].evidence[0] = { stage: 2, quote: "P3 üçün 2880 AZN." };
    expect(() => validateReportContent(content, record)).toThrow();
  });
  it("does not accept unsaved text or whitespace as evidence", () => {
    const { record, content } = sample();
    record.answers[0].savedAt = null;
    expect(() => validateReportContent(content, record)).toThrow();
    record.answers[0].savedAt = new Date().toISOString();
    content.criteria[0].evidence[0].quote = " ";
    expect(() => validateReportContent(content, record)).toThrow();
  });
  it("requires evidence for demonstrated/partial and allows absent evidence only for not demonstrated", () => {
    const { record, content } = sample();
    content.criteria[0].evidence = [];
    expect(() => validateReportContent(content, record)).toThrow();
    content.criteria[0].level = "partial";
    expect(() => validateReportContent(content, record)).toThrow();
    content.criteria[0].level = "not_demonstrated";
    expect(() => validateReportContent(content, record)).not.toThrow();
  });
  it("binds cached results to owner, session, assessment and accepted answers", () => {
    const { record, content } = sample();
    const envelope = {
      owner: record.owner,
      invitationId: record.id,
      snapshotId: record.snapshotId,
      sessionId: record.sessionId,
      binding: reportBinding(record),
      report: {
        ...content,
        source: "claude" as const,
        model: "test",
        createdAt: new Date().toISOString(),
      },
    };
    expect(verifyCached(envelope, record)).toEqual(envelope.report);
    expect(() =>
      verifyCached({ ...envelope, owner: "other" }, record),
    ).toThrow();
    const changed = structuredClone(record);
    changed.answers[0].answer += "Changed";
    expect(() => verifyCached(envelope, changed)).toThrow();
    changed.answers = structuredClone(record.answers);
    changed.snapshotId = crypto.randomUUID();
    expect(() => verifyCached(envelope, changed)).toThrow();
  });
  it("does not invalidate a final report when only session access tokens/revision change", () => {
    const { record } = sample();
    const before = reportBinding(record);
    record.revision++;
    record.sessionHashes.push({
      hash: "a".repeat(64),
      expiresAt: Date.now() + 1000,
    });
    expect(reportBinding(record)).toBe(before);
  });
});
