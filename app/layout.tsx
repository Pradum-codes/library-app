import type { Metadata } from "next";

import "./globals.css";
import { NavBar } from "@/components/sections/NavBar";

export const metadata: Metadata = {
  title: "BookNest",
  description: "Curated book recommendations by genre and mood.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
