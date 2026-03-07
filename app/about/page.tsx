import { Footer } from "@/components/sections/Footer";
import { getSiteData } from "@/lib/site-data";
import { Card, CardContent } from "@/components/ui/card";

export default async function AboutPage() {
  const data = await getSiteData();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="max-w-3xl">
        <h1 className="font-display text-4xl text-primary">About Us</h1>
        <p className="mt-4 text-muted-foreground">{data.site.about}</p>
      </div>
      <Card className="mt-10">
        <CardContent className="p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Our Promise
          </p>
          <p className="mt-4 text-lg text-primary">
            We curate each list to help you fall in love with reading again—one genre at a time.
          </p>
        </CardContent>
      </Card>
      <Footer
        contactEmail={data.site.contact.email}
        note={data.site.contact.note}
      />
    </main>
  );
}
