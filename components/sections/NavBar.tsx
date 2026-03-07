import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-display text-xl">
            B
          </div>
          <div>
            <p className="font-display text-xl">BookNest</p>
            <p className="text-xs text-muted-foreground">Curated reading escapes</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
          <Link href="/" className="transition hover:text-primary">
            Home
          </Link>
          <Link href="/about" className="transition hover:text-primary">
            About
          </Link>
          <Link href="/genre" className="transition hover:text-primary">
            Genres
          </Link>
          <Link href="#contact" className="transition hover:text-primary">
            Contact
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="hidden md:inline-flex">
            Daily picks
          </Badge>
          <Button asChild size="sm">
            <Link href="/genre/mystery-and-investigation">Explore</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
