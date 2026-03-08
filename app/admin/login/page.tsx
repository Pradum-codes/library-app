import { redirect } from "next/navigation";

import { AdminLogin } from "@/components/admin/AdminLogin";
import { getAdminSession } from "@/lib/auth";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <main className="relative overflow-hidden bg-[#f7f1ea] px-6 pb-16 pt-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#f3d9c6] blur-3xl" />
        <div className="absolute right-0 top-10 h-64 w-64 rounded-full bg-[#c9d8cf] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#d2c3df] blur-3xl" />
      </div>
      <div className="relative mx-auto grid min-h-[70vh] max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
            BookNest Admin
          </p>
          <h1 className="font-display text-4xl text-primary md:text-5xl">
            Control the collection with confidence.
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground md:text-base">
            Keep genres fresh, spotlight new arrivals, and refine the homepage
            story with a secure, focused workspace.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: "Instant edits", value: "Update books fast" },
              { label: "Curated picks", value: "Shape the homepage" },
              { label: "Audit trail", value: "Track every change" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-xs text-muted-foreground shadow-sm backdrop-blur"
              >
                <p className="text-sm font-semibold text-primary">{item.label}</p>
                <p>{item.value}</p>
              </div>
            ))}
          </div>
        </section>
        <div className="flex justify-center lg:justify-end">
          <AdminLogin />
        </div>
      </div>
    </main>
  );
}
