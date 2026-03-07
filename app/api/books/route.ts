import { getSiteData } from "@/lib/site-data";

export async function GET() {
  const data = await getSiteData();
  return Response.json(data);
}
