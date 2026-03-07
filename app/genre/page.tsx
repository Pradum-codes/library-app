import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/sections/Footer";
import { GenreGrid } from "@/components/sections/GenreGrid";
import { getSiteData } from "@/lib/site-data";

export default async function GenreLandingPage() {
  const data = await getSiteData();

  return (
    <main>
      <section className="mx-auto max-w-6xl px-6 pb-8 pt-12">
        <Badge variant="secondary">Browse by Genre</Badge>
        <h1 className="mt-6 font-display text-4xl text-primary md:text-5xl">
          Find the shelf that fits your mood
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          {data.site.tagline}. Explore the genres below to dive into curated
          reading paths.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="sm">
            <Link href="/genre/mystery-and-investigation">
              Start with mystery
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/about">Why BookNest</Link>
          </Button>
        </div>
      </section>
      <GenreGrid genres={data.genres} />
      <Footer
        contactEmail={data.site.contact.email}
        note={data.site.contact.note}
      />
    </main>
  );
}
