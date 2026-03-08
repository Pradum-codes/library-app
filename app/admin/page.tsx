import { AdminPanel } from "@/components/admin/AdminPanel";
import { getSiteData } from "@/lib/site-data";
import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  await requireAdmin();
  const data = await getSiteData();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-16 pt-10">
      <AdminPanel initialData={data} />
    </main>
  );
}
