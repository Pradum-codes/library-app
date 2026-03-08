import { getAdminSession } from "@/lib/auth";
import { updateSiteData } from "@/lib/site-data";
import { addAdminActivity } from "@/lib/admin-audit";

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { featured?: string[] };
  if (!body?.featured || !Array.isArray(body.featured)) {
    return Response.json({ error: "Featured list is required." }, { status: 400 });
  }

  const featured = body.featured.map((id) => id.trim()).filter(Boolean);
  const deduped = Array.from(new Set(featured));

  try {
    const data = await updateSiteData((current) => {
      const bookIds = new Set(current.books.map((book) => book.id));
      const invalid = deduped.filter((id) => !bookIds.has(id));
      if (invalid.length > 0) {
        throw new Error("Featured list contains unknown book IDs.");
      }

      return { ...current, featured: deduped };
    });

    addAdminActivity({
      action: "reorder",
      entity: "featured",
      summary: `Updated featured list (${deduped.length} picks).`,
      actor: session.sub,
      meta: { featured: deduped },
    }).catch(() => null);

    return Response.json({ data });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Update failed." },
      { status: 400 }
    );
  }
}
