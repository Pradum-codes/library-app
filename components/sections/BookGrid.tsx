import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  image: string;
  lessons?: string[];
}

interface BookGridProps {
  title: string;
  subtitle: string;
  books: Book[];
}

export function BookGrid({ title, subtitle, books }: BookGridProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="max-w-3xl">
        <h2 className="section-title">{title}</h2>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {books.map((book) => (
          <Card key={book.id} className="overflow-hidden">
            <CardHeader className="space-y-3">
              <div className="relative h-56 w-full overflow-hidden rounded-2xl">
                <Image
                  src={book.image}
                  alt={book.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Featured</Badge>
                <span className="text-xs text-muted-foreground">
                  {book.author || "Author TBD"}
                </span>
              </div>
              <CardTitle className="font-display text-2xl text-primary">
                {book.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{book.description}</p>
              {book.lessons && book.lessons.length > 0 ? (
                <div>
                  <p className="text-sm font-semibold text-primary">
                    This book helps readers learn:
                  </p>
                  <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
                    {book.lessons.map((lesson) => (
                      <li key={lesson}>• {lesson}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
