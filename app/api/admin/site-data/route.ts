import { getAdminSession } from "@/lib/auth";
import { getSiteData } from "@/lib/site-data";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getSiteData();
  return Response.json({ data });
}
