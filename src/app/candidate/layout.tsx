import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Namizəd sınağı | SkillProof AI",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
