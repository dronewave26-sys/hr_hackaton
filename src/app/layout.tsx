import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillProof AI — Bacarıqları sübutla gör",
  description: "CV iddialarını iş nümunələri ilə müqayisə etmək üçün HR iş məkanı.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="az"><body>{children}</body></html>;
}
