import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  invitationListResponseSchema,
  practicalReportResponseSchema,
} from "@/lib/reports/contracts";
import { requireSameOrigin } from "../context";
import { failure, privateHeaders, readJSON } from "../http";
import { AppError } from "../errors";
import { reportOwner, ownedInvitationList, ownedRecord } from "./access";
import { practicalReportStore } from "./store";
import {
  reportBinding,
  terminalSnapshot,
  verifyCached,
  type ReportEnvelope,
} from "./model";
import { generatePracticalReport, reportAIReady } from "./claude";

const headers = { ...privateHeaders, "Referrer-Policy": "no-referrer" };

export async function listInvitations(request: NextRequest) {
  try {
    const input = z
      .object({ vacancyId: z.uuid(), candidateId: z.uuid() })
      .parse({
        vacancyId: request.nextUrl.searchParams.get("vacancyId"),
        candidateId: request.nextUrl.searchParams.get("candidateId"),
      });
    const { owner, storage } = await reportOwner(request);
    const invitations = await ownedInvitationList(
      request,
      owner,
      storage,
      input.vacancyId,
      input.candidateId,
    );
    return NextResponse.json(
      invitationListResponseSchema.parse({ invitations }),
      { headers },
    );
  } catch (error) {
    return failure(error);
  }
}

export async function practicalReport(
  request: NextRequest,
  id: string,
  generate = false,
) {
  try {
    z.uuid().parse(id);
    if (generate) {
      requireSameOrigin(request);
      z.object({})
        .strict()
        .parse(await readJSON(request, 1024));
    }
    const { owner, storage } = await reportOwner(request);
    const record = await ownedRecord(request, owner, id);
    terminalSnapshot(record);
    const store = practicalReportStore(storage);
    const existing = await store.get(owner, id);
    if (existing)
      return NextResponse.json(
        practicalReportResponseSchema.parse({
          report: verifyCached(existing, record),
          aiReady: reportAIReady(),
        }),
        { headers },
      );
    if (!generate)
      return NextResponse.json(
        { report: null, aiReady: reportAIReady() },
        { headers },
      );
    const report = await generatePracticalReport(record);
    // Check once more after the external call; revocation/changed answers cannot
    // be attached silently to an earlier generation. Supabase also checks under lock.
    const latest = await ownedRecord(request, owner, id);
    if (reportBinding(latest) !== reportBinding(record))
      throw new AppError(
        "Sınağın yekun cavabları dəyişib. Yeniləyib təkrar cəhd edin.",
        409,
      );
    const envelope: ReportEnvelope = {
      invitationId: id,
      owner,
      snapshotId: record.snapshotId,
      sessionId: record.sessionId,
      binding: reportBinding(record),
      report,
    };
    const saved = await store.put(envelope, record);
    return NextResponse.json(
      practicalReportResponseSchema.parse({
        report: verifyCached(saved, latest),
        aiReady: reportAIReady(),
      }),
      { headers },
    );
  } catch (error) {
    return failure(error);
  }
}
