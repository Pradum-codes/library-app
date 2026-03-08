import { getAdminSession } from "@/lib/auth";
import { getAdminActivity } from "@/lib/admin-audit";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 80;
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 80;

  const activity = await getAdminActivity(safeLimit);
  return Response.json({ activity });
}
