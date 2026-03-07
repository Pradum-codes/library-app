import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-4xl text-primary">Page not found</h1>
      <p className="text-muted-foreground">
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
