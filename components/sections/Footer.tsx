import { Separator } from "@/components/ui/separator";

interface FooterProps {
  contactEmail: string;
  note: string;
}

export function Footer({ contactEmail, note }: FooterProps) {
  return (
    <footer id="contact" className="mx-auto max-w-6xl px-6 py-12">
      <Separator />
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg text-primary">BookNest</p>
          <p className="text-sm text-muted-foreground">{note}</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Contact: {contactEmail}
        </div>
        <div className="text-xs text-muted-foreground">
          © 2026 BookNest. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
