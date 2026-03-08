import { getAdminSession } from "@/lib/auth";
import { updateSiteData } from "@/lib/site-data";
import { addAdminActivity } from "@/lib/admin-audit";
import type { Genre } from "@/lib/site-types";

function isNonEmpty(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateGenreInput(genre: Genre) {
  if (!isNonEmpty(genre.slug)) {
    return "Genre slug is required.";
  }
  if (!isNonEmpty(genre.name)) {
    return "Genre name is required.";
  }
  if (!isNonEmpty(genre.description)) {
    return "Genre description is required.";
  }
  if (!isNonEmpty(genre.hero)) {
    return "Genre hero text is required.";
  }
  if (!isNonEmpty(genre.image)) {
    return "Genre image URL is required.";
  }
  return null;
}

function normalizeGenre(genre: Genre): Genre {
  return {
    slug: genre.slug.trim(),
    name: genre.name.trim(),
    description: genre.description.trim(),
    hero: genre.hero.trim(),
    image: genre.image.trim(),
  };
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { genre?: Genre };
  if (!body?.genre) {
    return Response.json({ error: "Genre data is required." }, { status: 400 });
  }

  const normalized = normalizeGenre(body.genre);
  const validation = validateGenreInput(normalized);
  if (validation) {
    return Response.json({ error: validation }, { status: 400 });
  }

  try {
    const data = await updateSiteData((current) => {
      if (current.genres.find((item) => item.slug === normalized.slug)) {
        throw new Error("Genre slug already exists.");
      }

      return {
        ...current,
        genres: [...current.genres, normalized],
      };
    });

    addAdminActivity({
      action: "create",
      entity: "genre",
      entityId: normalized.slug,
      summary: `Created genre "${normalized.name}".`,
      actor: session.sub,
      meta: { name: normalized.name },
    }).catch(() => null);

    return Response.json({ data });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Create failed." },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { slug?: string; genre?: Genre };
  const slug = body?.slug?.trim();
  if (!slug || !body?.genre) {
    return Response.json({ error: "Genre update payload is required." }, { status: 400 });
  }

  const normalized = normalizeGenre(body.genre);
  const validation = validateGenreInput(normalized);
  if (validation) {
    return Response.json({ error: validation }, { status: 400 });
  }

  let previousName = "";
  try {
    const data = await updateSiteData((current) => {
      const index = current.genres.findIndex((item) => item.slug === slug);
      if (index === -1) {
        throw new Error("Genre not found.");
      }

      if (normalized.slug !== slug) {
        const exists = current.genres.find(
          (item) => item.slug === normalized.slug
        );
        if (exists) {
          throw new Error("Genre slug already exists.");
        }
      }

      previousName = current.genres[index]?.name ?? "";
      const nextGenres = [...current.genres];
      nextGenres[index] = normalized;

      const nextBooks = current.books.map((book) =>
        book.genre === slug ? { ...book, genre: normalized.slug } : book
      );

      return {
        ...current,
        genres: nextGenres,
        books: nextBooks,
      };
    });

    addAdminActivity({
      action: "update",
      entity: "genre",
      entityId: normalized.slug,
      summary: `Updated genre "${normalized.name}".`,
      actor: session.sub,
      meta: {
        previousSlug: slug,
        previousName,
        name: normalized.name,
      },
    }).catch(() => null);

    return Response.json({ data });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Update failed." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { slug?: string };
  const slug = body?.slug?.trim();
  if (!slug) {
    return Response.json({ error: "Genre slug is required." }, { status: 400 });
  }

  let deletedName = "";
  try {
    const data = await updateSiteData((current) => {
      const exists = current.genres.find((item) => item.slug === slug);
      if (!exists) {
        throw new Error("Genre not found.");
      }

      deletedName = exists.name;

      const booksUsing = current.books.filter(
        (book) => book.genre === slug
      );
      if (booksUsing.length > 0) {
        throw new Error("Remove or move books before deleting this genre.");
      }

      return {
        ...current,
        genres: current.genres.filter((item) => item.slug !== slug),
      };
    });

    addAdminActivity({
      action: "delete",
      entity: "genre",
      entityId: slug,
      summary: `Deleted genre "${deletedName || slug}".`,
      actor: session.sub,
      meta: { name: deletedName },
    }).catch(() => null);

    return Response.json({ data });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Delete failed." },
      { status: 400 }
    );
  }
}
