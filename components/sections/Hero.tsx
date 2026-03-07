import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface HeroProps {
  title: string;
  subtitle: string;
}

export function Hero({ title, subtitle }: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-16 pt-12 md:flex-row md:items-center md:justify-between md:pb-24">
        <div className="flex-1 space-y-6">
          <Badge variant="secondary">BookNest Spotlight</Badge>
          <h1 className="font-display text-4xl leading-tight text-primary md:text-6xl">
            {title}
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">{subtitle}</p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/genre">Browse Genres</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/about">Why BookNest</Link>
            </Button>
          </div>
        </div>
        <div className="relative flex-1">
          <div className="absolute -right-12 top-8 h-56 w-56 rounded-full bg-secondary/60 blur-3xl" />
          <div className="absolute bottom-6 right-6 h-40 w-40 rounded-full bg-accent/70 blur-3xl" />
          <div className="relative rounded-[2.5rem] border bg-card/90 p-8 shadow-xl">
            <p className="font-display text-2xl text-primary">"A shelf of worlds, one click away."</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Discover page-turners, thoughtful classics, and modern masterpieces curated by genre and mood.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
