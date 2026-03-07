import Image from "next/image";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Genre {
  slug: string;
  name: string;
  description: string;
  image: string;
}

interface GenreGridProps {
  genres: Genre[];
  ctaHref?: string;
  ctaLabel?: string;
}

export function GenreGrid({ genres, ctaHref, ctaLabel }: GenreGridProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="section-title">What’s Your Genre of the Day?</h2>
          <p className="mt-2 text-muted-foreground">
            Step into curated shelves built for every mood.
          </p>
        </div>
        {ctaHref && ctaLabel ? (
          <Button variant="outline" asChild>
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        ) : null}
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {genres.map((genre) => (
          <Card key={genre.slug} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid gap-4 md:grid-cols-[200px_1fr]">
                <div className="relative h-48 md:h-full">
                  <Image
                    src={genre.image}
                    alt={genre.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-4 p-6">
                  <h3 className="font-display text-2xl text-primary">
                    {genre.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {genre.description}
                  </p>
                  <Button asChild size="sm">
                    <Link href={`/genre/${genre.slug}`}>Explore</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
