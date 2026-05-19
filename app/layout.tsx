import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sana",
  description: "Heal, remember, recover.",
};

// The actual <html>/<body> live in app/[locale]/layout.tsx because the lang attribute
// must reflect the active locale.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
