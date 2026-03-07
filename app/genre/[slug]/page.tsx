import { notFound } from "next/navigation";

import { BookGrid } from "@/components/sections/BookGrid";
import { Footer } from "@/components/sections/Footer";
import { getSiteData } from "@/lib/site-data";

interface GenrePageProps {
  params: Promise<{ slug: string }>;
}

export default async function GenrePage({ params }: GenrePageProps) {
  const data = await getSiteData();
  const { slug } = await params;
  const genre = data.genres.find((item) => item.slug === slug);

  if (!genre) {
    notFound();
  }

  const normalizeGenre = (value: string) =>
    value
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const genreAliases: Record<string, string> = {
    "mystery-and-detective": "mystery-and-investigation",
  };

  const resolvedGenreSlug = genre.slug;
  const books = data.books.filter((book) => {
    const normalized = normalizeGenre(book.genre);
    const mapped = genreAliases[normalized] ?? normalized;
    return mapped === resolvedGenreSlug;
  });

  return (
    <main>
      <BookGrid title={genre.name} subtitle={genre.hero} books={books} />
      <Footer
        contactEmail={data.site.contact.email}
        note={data.site.contact.note}
      />
    </main>
  );
}
