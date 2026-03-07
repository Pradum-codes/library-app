import { FeaturedMarquee } from "@/components/sections/FeaturedMarquee";
import { Footer } from "@/components/sections/Footer";
import { GenreGrid } from "@/components/sections/GenreGrid";
import { Hero } from "@/components/sections/Hero";
import { getSiteData } from "@/lib/site-data";

export default async function HomePage() {
  const data = await getSiteData();
  const featured = data.featured
    .map((id) => data.books.find((book) => book.id === id))
    .filter(Boolean)
    .map((book) => ({
      id: book!.id,
      title: book!.title,
      image: book!.image,
    }));

  return (
    <main>
      <Hero title={data.site.heroTitle} subtitle={data.site.heroSubtitle} />
      <FeaturedMarquee items={featured} />
      <GenreGrid genres={data.genres} ctaHref="/genre" ctaLabel="Browse all" />
      <Footer
        contactEmail={data.site.contact.email}
        note={data.site.contact.note}
      />
    </main>
  );
}
