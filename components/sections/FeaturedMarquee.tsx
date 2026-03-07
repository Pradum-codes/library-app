import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";

interface FeaturedBook {
  id: string;
  title: string;
  image: string;
}

interface FeaturedMarqueeProps {
  items: FeaturedBook[];
}

export function FeaturedMarquee({ items }: FeaturedMarqueeProps) {
  const doubled = [...items, ...items];

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h2 className="section-title">Today’s Select</h2>
      <div className="mt-6 overflow-hidden rounded-[2.5rem] border bg-card/70 shadow-sm">
        <div className="flex gap-6 p-6 animate-marquee">
          {doubled.map((item, index) => (
            <Card key={`${item.id}-${index}`} className="w-56 shrink-0">
              <CardContent className="p-4">
                <div className="relative h-40 w-full overflow-hidden rounded-2xl">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="mt-3 font-semibold text-sm text-primary">
                  {item.title}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
