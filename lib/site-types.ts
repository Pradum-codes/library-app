export interface SiteContact {
  email: string;
  note: string;
}

export interface SiteInfo {
  name: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  about: string;
  contact: SiteContact;
}

export interface Genre {
  slug: string;
  name: string;
  description: string;
  hero: string;
  image: string;
}

export interface Book {
  id: string;
  genre: string;
  title: string;
  author: string;
  description: string;
  image: string;
}

export interface AdminAuditEntry {
  id: string;
  action: "create" | "update" | "delete" | "reorder" | "login" | "logout";
  entity: "book" | "genre" | "featured" | "site" | "admin";
  entityId?: string;
  summary: string;
  actor: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export interface SiteData {
  site: SiteInfo;
  featured: string[];
  genres: Genre[];
  books: Book[];
}
