import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - BookNest",
  description: "BookNest admin control panel.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-screen bg-gradient-to-br from-[#f8f0e6] via-[#fef8f1] to-[#f2e4d3] text-foreground">
      {children}
    </section>
  );
}
