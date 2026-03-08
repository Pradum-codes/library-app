import { getAdminSession } from "@/lib/auth";
import { updateSiteData } from "@/lib/site-data";
import { addAdminActivity } from "@/lib/admin-audit";
import type { Book } from "@/lib/site-types";

function isNonEmpty(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateBookInput(book: Book) {
  if (!isNonEmpty(book.id)) {
    return "Book ID is required.";
  }
  if (!isNonEmpty(book.title)) {
    return "Title is required.";
  }
  if (!isNonEmpty(book.genre)) {
    return "Genre is required.";
  }
  if (!isNonEmpty(book.description)) {
    return "Description is required.";
  }
  if (!isNonEmpty(book.image)) {
    return "Cover image URL is required.";
  }
  return null;
}

function normalizeBook(book: Book): Book {
  return {
    id: book.id.trim(),
    genre: book.genre.trim(),
    title: book.title.trim(),
    author: (book.author ?? "").trim(),
    description: book.description.trim(),
    image: book.image.trim(),
  };
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { book?: Book };
  if (!body?.book) {
    return Response.json({ error: "Book data is required." }, { status: 400 });
  }

  const book = normalizeBook(body.book);
  const validation = validateBookInput(book);
  if (validation) {
    return Response.json({ error: validation }, { status: 400 });
  }

  try {
    const data = await updateSiteData((current) => {
      if (!current.genres.find((genre) => genre.slug === book.genre)) {
        throw new Error("Genre does not exist.");
      }
      if (current.books.find((item) => item.id === book.id)) {
        throw new Error("Book ID already exists.");
      }
      return {
        ...current,
        books: [...current.books, book],
      };
    });

    addAdminActivity({
      action: "create",
      entity: "book",
      entityId: book.id,
      summary: `Created book "${book.title}".`,
      actor: session.sub,
      meta: { title: book.title, genre: book.genre },
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

  const body = (await request.json()) as { id?: string; book?: Book };
  const id = body?.id?.trim();
  if (!id || !body?.book) {
    return Response.json({ error: "Book update payload is required." }, { status: 400 });
  }

  const normalized = normalizeBook(body.book);
  const validation = validateBookInput(normalized);
  if (validation) {
    return Response.json({ error: validation }, { status: 400 });
  }

  let previousTitle = "";
  try {
    const data = await updateSiteData((current) => {
      const index = current.books.findIndex((item) => item.id === id);
      if (index === -1) {
        throw new Error("Book not found.");
      }
      if (!current.genres.find((genre) => genre.slug === normalized.genre)) {
        throw new Error("Genre does not exist.");
      }

      if (normalized.id !== id) {
        const exists = current.books.find((item) => item.id === normalized.id);
        if (exists) {
          throw new Error("Book ID already exists.");
        }
      }

      previousTitle = current.books[index]?.title ?? "";
      const nextBooks = [...current.books];
      nextBooks[index] = normalized;

      const nextFeatured = current.featured.map((featuredId) =>
        featuredId === id ? normalized.id : featuredId
      );

      return {
        ...current,
        books: nextBooks,
        featured: nextFeatured,
      };
    });

    addAdminActivity({
      action: "update",
      entity: "book",
      entityId: normalized.id,
      summary: `Updated book "${normalized.title}".`,
      actor: session.sub,
      meta: {
        previousId: id,
        previousTitle,
        title: normalized.title,
        genre: normalized.genre,
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

  const body = (await request.json()) as { id?: string };
  const id = body?.id?.trim();
  if (!id) {
    return Response.json({ error: "Book ID is required." }, { status: 400 });
  }

  let deletedTitle = "";
  try {
    const data = await updateSiteData((current) => {
      const exists = current.books.find((item) => item.id === id);
      if (!exists) {
        throw new Error("Book not found.");
      }

      deletedTitle = exists.title;

      return {
        ...current,
        books: current.books.filter((item) => item.id !== id),
        featured: current.featured.filter((itemId) => itemId !== id),
      };
    });

    addAdminActivity({
      action: "delete",
      entity: "book",
      entityId: id,
      summary: `Deleted book "${deletedTitle || id}".`,
      actor: session.sub,
      meta: { title: deletedTitle },
    }).catch(() => null);

    return Response.json({ data });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Delete failed." },
      { status: 400 }
    );
  }
}
