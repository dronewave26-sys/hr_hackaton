import { CandidateApp } from "@/components/candidate/candidate-app";
export const dynamic = "force-dynamic";
export default async function CandidatePage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;
  return <CandidateApp key={invitationId} invitationId={invitationId} />;
}
