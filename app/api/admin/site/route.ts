import { getAdminSession } from "@/lib/auth";
import { updateSiteData } from "@/lib/site-data";
import { addAdminActivity } from "@/lib/admin-audit";
import type { SiteInfo } from "@/lib/site-types";

function isNonEmpty(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateSite(site: SiteInfo) {
  if (!isNonEmpty(site.name)) {
    return "Site name is required.";
  }
  if (!isNonEmpty(site.tagline)) {
    return "Tagline is required.";
  }
  if (!isNonEmpty(site.heroTitle)) {
    return "Hero title is required.";
  }
  if (!isNonEmpty(site.heroSubtitle)) {
    return "Hero subtitle is required.";
  }
  if (!isNonEmpty(site.about)) {
    return "About text is required.";
  }
  if (!site.contact || !isNonEmpty(site.contact.email)) {
    return "Contact email is required.";
  }
  if (!isNonEmpty(site.contact.note)) {
    return "Contact note is required.";
  }
  return null;
}

function normalizeSite(site: SiteInfo): SiteInfo {
  return {
    name: site.name.trim(),
    tagline: site.tagline.trim(),
    heroTitle: site.heroTitle.trim(),
    heroSubtitle: site.heroSubtitle.trim(),
    about: site.about.trim(),
    contact: {
      email: site.contact.email.trim(),
      note: site.contact.note.trim(),
    },
  };
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { site?: SiteInfo };
  if (!body?.site) {
    return Response.json({ error: "Site data is required." }, { status: 400 });
  }

  const normalized = normalizeSite(body.site);
  const validation = validateSite(normalized);
  if (validation) {
    return Response.json({ error: validation }, { status: 400 });
  }

  try {
    const data = await updateSiteData((current) => ({
      ...current,
      site: normalized,
    }));

    addAdminActivity({
      action: "update",
      entity: "site",
      summary: "Updated site settings.",
      actor: session.sub,
      meta: { name: normalized.name },
    }).catch(() => null);

    return Response.json({ data });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Update failed." },
      { status: 400 }
    );
  }
}
