import { describe, expect, it } from "vitest";
import {
  actionSchema,
  validateAnalysis,
  workspaceSchema,
} from "../../src/lib/domain";
import { createFixtures, savedDemoAnalysis } from "../../src/lib/fixtures";

describe("CV evidence boundaries", () => {
  it("validates the actual source of all four saved demo analyses", () => {
    for (const vacancy of createFixtures()) {
      for (const candidate of vacancy.candidates) {
        const analysis = savedDemoAnalysis(vacancy, candidate.id);
        expect(() =>
          validateAnalysis(analysis, vacancy.skills, candidate.cv),
        ).not.toThrow();
        expect(analysis.items).toHaveLength(vacancy.skills.length);
      }
    }
  });
  it("rejects a quote that is absent from the CV", () => {
    const job = createFixtures()[0];
    const person = job.candidates[0];
    const analysis = savedDemoAnalysis(job, person.id);
    analysis.items[0].quote = "Mənim 20 illik olmayan təcrübəm var.";
    expect(() => validateAnalysis(analysis, job.skills, person.cv)).toThrow(
      "CV mətnində",
    );
  });
  it("requires every confirmed skill exactly once", () => {
    const job = createFixtures()[0];
    const person = job.candidates[0];
    const analysis = savedDemoAnalysis(job, person.id);
    analysis.items[1].skill = analysis.items[0].skill;
    expect(() => validateAnalysis(analysis, job.skills, person.cv)).toThrow();
  });
  it("does not permit a missing claim to contain invented evidence", () => {
    const job = createFixtures()[0];
    const person = job.candidates[1];
    const analysis = savedDemoAnalysis(job, person.id);
    const missing = analysis.items.find((item) => item.status === "missing")!;
    missing.quote = "CRM-də qeyd etmişəm";
    expect(() => validateAnalysis(analysis, job.skills, person.cv)).toThrow();
  });
  it("does not reuse a preset report for an edited CV", () => {
    const job = createFixtures()[0];
    job.candidates[0].cv += "\nBaşqa məlumat.";
    expect(() => savedDemoAnalysis(job, job.candidates[0].id)).toThrow(
      "dəyişdirilməmiş",
    );
  });
  it("does not assign a demo report to a new candidate", () => {
    const job = createFixtures()[0];
    delete job.candidates[0].demoKey;
    expect(() => savedDemoAnalysis(job, job.candidates[0].id)).toThrow();
  });
});

describe("workspace contracts", () => {
  it("rejects repeated criteria on save while keeping old workspaces readable", () => {
    const vacancy = createFixtures()[0];
    vacancy.assessment!.criteria = ["Hesablama", "Hesablama"];
    expect(
      workspaceSchema.safeParse({ revision: 1, vacancies: [vacancy] }).success,
    ).toBe(true);
    expect(
      actionSchema.safeParse({
        type: "saveAssessment",
        revision: 1,
        vacancyId: vacancy.id,
        assessment: vacancy.assessment,
        approve: true,
      }).success,
    ).toBe(false);
  });
  it("accepts both full demo fixtures and rejects corrupt stored shape", () => {
    expect(
      workspaceSchema.safeParse({ revision: 1, vacancies: createFixtures() })
        .success,
    ).toBe(true);
    expect(
      workspaceSchema.safeParse({
        revision: 1,
        vacancies: [{ title: "incomplete" }],
      }).success,
    ).toBe(false);
  });
  it("rejects duplicate skills and excessive CV input", () => {
    expect(
      actionSchema.safeParse({
        type: "create",
        revision: 0,
        title: "Test",
        department: "Satış",
        description: "A sufficiently detailed vacancy description.",
        skills: ["CRM", "CRM"],
      }).success,
    ).toBe(false);
    expect(
      actionSchema.safeParse({
        type: "addCandidate",
        revision: 0,
        vacancyId: crypto.randomUUID(),
        name: "Demo",
        cv: "a".repeat(30001),
      }).success,
    ).toBe(false);
  });
});
