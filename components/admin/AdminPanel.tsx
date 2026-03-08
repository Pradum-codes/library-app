"use client";

import { useMemo, useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  AdminAuditEntry,
  Book,
  Genre,
  SiteData,
  SiteInfo,
} from "@/lib/site-types";

const emptyBook: Book = {
  id: "",
  genre: "",
  title: "",
  author: "",
  description: "",
  image: "",
};

const emptyGenre: Genre = {
  slug: "",
  name: "",
  description: "",
  hero: "",
  image: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminPanel({ initialData }: { initialData: SiteData }) {
  const [data, setData] = useState<SiteData>(initialData);
  const [activeTab, setActiveTab] = useState<
    "books" | "genres" | "featured" | "site" | "activity"
  >("books");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState<AdminAuditEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<
    null | "book" | "genre"
  >(null);

  const [bookForm, setBookForm] = useState<Book>(() => {
    const defaultGenre = initialData.genres[0]?.slug ?? "";
    return { ...emptyBook, genre: defaultGenre };
  });
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bookQuery, setBookQuery] = useState("");
  const [bookGenre, setBookGenre] = useState("all");

  const [genreForm, setGenreForm] = useState<Genre>(emptyGenre);
  const [editingGenreSlug, setEditingGenreSlug] = useState<string | null>(null);

  const [featuredDraft, setFeaturedDraft] = useState<string[]>(
    initialData.featured
  );
  const [siteForm, setSiteForm] = useState<SiteInfo>(initialData.site);

  useEffect(() => {
    setFeaturedDraft(data.featured);
  }, [data.featured]);

  useEffect(() => {
    setSiteForm(data.site);
  }, [data.site]);

  useEffect(() => {
    if (activeTab !== "activity") {
      return;
    }
    fetchActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const filteredBooks = useMemo(() => {
    const query = bookQuery.trim().toLowerCase();
    return data.books.filter((book) => {
      const matchesQuery =
        !query ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.id.toLowerCase().includes(query);
      const matchesGenre =
        bookGenre === "all" ? true : book.genre === bookGenre;
      return matchesQuery && matchesGenre;
    });
  }, [data.books, bookQuery, bookGenre]);

  const featuredBooks = useMemo(() => {
    return featuredDraft
      .map((id) => data.books.find((book) => book.id === id))
      .filter(Boolean) as Book[];
  }, [featuredDraft, data.books]);

  const availableFeatured = useMemo(() => {
    const set = new Set(featuredDraft);
    return data.books.filter((book) => !set.has(book.id));
  }, [data.books, featuredDraft]);

  const resetBookForm = () => {
    setEditingBookId(null);
    setBookForm({ ...emptyBook, genre: data.genres[0]?.slug ?? "" });
  };

  const resetGenreForm = () => {
    setEditingGenreSlug(null);
    setGenreForm(emptyGenre);
  };

  const showStatus = (message: string) => {
    setStatus(message);
    setTimeout(() => setStatus(null), 3000);
  };

  const cloudinaryConfig = {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    folder: process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER,
  };

  const apiCall = async (path: string, options: RequestInit) => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(path, options);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error ?? "Request failed");
      }
      if (payload?.data) {
        setData(payload.data as SiteData);
      }
      return payload;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await apiCall("/api/admin/site-data", { method: "GET" });
    showStatus("Data refreshed.");
  };

  const fetchActivity = async () => {
    setActivityError(null);
    setActivityLoading(true);
    try {
      const response = await fetch("/api/admin/activity?limit=80");
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load activity.");
      }
      setActivity((payload?.activity ?? []) as AdminAuditEntry[]);
    } catch (err) {
      setActivityError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setActivityLoading(false);
    }
  };

  const uploadToCloudinary = async (file: File) => {
    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
      throw new Error(
        "Cloudinary upload is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
      );
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", cloudinaryConfig.uploadPreset);
    if (cloudinaryConfig.folder) {
      formData.append("folder", cloudinaryConfig.folder);
    }
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      { method: "POST", body: formData }
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? "Image upload failed.");
    }
    return payload?.secure_url as string;
  };

  const handleImageUpload = async (
    target: "book" | "genre",
    file: File
  ) => {
    setUploadingTarget(target);
    try {
      const url = await uploadToCloudinary(file);
      if (target === "book") {
        setBookForm((prev) => ({ ...prev, image: url }));
      } else {
        setGenreForm((prev) => ({ ...prev, image: url }));
      }
      showStatus("Image uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleBookSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = {
      id: editingBookId,
      book: bookForm,
    };
    const method = editingBookId ? "PUT" : "POST";
    await apiCall("/api/admin/books", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    showStatus(editingBookId ? "Book updated." : "Book added.");
    resetBookForm();
  };

  const handleBookDelete = async (id: string) => {
    if (!confirm("Delete this book?")) {
      return;
    }
    await apiCall("/api/admin/books", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    showStatus("Book deleted.");
    if (editingBookId === id) {
      resetBookForm();
    }
  };

  const handleGenreSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = {
      slug: editingGenreSlug,
      genre: genreForm,
    };
    const method = editingGenreSlug ? "PUT" : "POST";
    await apiCall("/api/admin/genres", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    showStatus(editingGenreSlug ? "Genre updated." : "Genre added.");
    resetGenreForm();
  };

  const handleGenreDelete = async (slug: string) => {
    if (!confirm("Delete this genre?")) {
      return;
    }
    await apiCall("/api/admin/genres", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    showStatus("Genre deleted.");
    if (editingGenreSlug === slug) {
      resetGenreForm();
    }
  };

  const handleFeaturedSave = async () => {
    await apiCall("/api/admin/featured", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: featuredDraft }),
    });
    showStatus("Featured list updated.");
  };

  const handleSiteSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await apiCall("/api/admin/site", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site: siteForm }),
    });
    showStatus("Site settings updated.");
  };

  const moveFeatured = (index: number, direction: number) => {
    const next = [...featuredDraft];
    const target = index + direction;
    if (target < 0 || target >= next.length) {
      return;
    }
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setFeaturedDraft(next);
  };

  const formatTimestamp = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            BookNest Control Room
          </p>
          <h1 className="font-display text-4xl text-primary">Admin Panel</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
          <form action="/api/admin/logout" method="POST">
            <Button variant="ghost" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      {status ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-700">
          {status}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {(
          [
            { id: "books", label: "Books" },
            { id: "genres", label: "Genres" },
            { id: "featured", label: "Today's Select" },
            { id: "site", label: "Site settings" },
            { id: "activity", label: "Activity" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-white/70 text-primary hover:bg-white"
            }`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "books" ? (
        <Card className="border-primary/10 bg-white/80 shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle>Manage books</CardTitle>
            <CardDescription>
              Add new titles or update the existing library entries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleBookSubmit}>
              <div>
                <label className="text-sm font-semibold">Title</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                  value={bookForm.title}
                  onChange={(event) => {
                    const title = event.target.value;
                    setBookForm((prev) => {
                      const nextId = prev.id
                        ? prev.id
                        : slugify(`${prev.genre}-${title}`);
                      return { ...prev, title, id: nextId };
                    });
                  }}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Author</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                  value={bookForm.author}
                  onChange={(event) =>
                    setBookForm((prev) => ({ ...prev, author: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Genre</label>
                <select
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                  value={bookForm.genre}
                  onChange={(event) =>
                    setBookForm((prev) => {
                      const genre = event.target.value;
                      const nextId = prev.id
                        ? prev.id
                        : slugify(`${genre}-${prev.title}`);
                      return { ...prev, genre, id: nextId };
                    })
                  }
                  required
                >
                  {data.genres.map((genre) => (
                    <option key={genre.slug} value={genre.slug}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold">ID</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                  value={bookForm.id}
                  onChange={(event) =>
                    setBookForm((prev) => ({ ...prev, id: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Description</label>
                <textarea
                  className="mt-2 min-h-[120px] w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                  value={bookForm.description}
                  onChange={(event) =>
                    setBookForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Cover image URL</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                  value={bookForm.image}
                  onChange={(event) =>
                    setBookForm((prev) => ({ ...prev, image: event.target.value }))
                  }
                  required
                />
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full max-w-xs rounded-2xl border border-border bg-white px-3 py-2 text-xs"
                    disabled={uploadingTarget === "book"}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      if (file) {
                        handleImageUpload("book", file);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                  <span>
                    {uploadingTarget === "book"
                      ? "Uploading to Cloudinary…"
                      : "Upload a new cover image directly from your device."}
                  </span>
                </div>
                {!cloudinaryConfig.cloudName ||
                !cloudinaryConfig.uploadPreset ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Cloudinary upload is not configured. Add
                    {" "}
                    <code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> and
                    {" "}
                    <code>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code>.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3 md:col-span-2">
                <Button type="submit" disabled={loading}>
                  {editingBookId ? "Update book" : "Add book"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetBookForm}
                >
                  Clear
                </Button>
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-3">
              <input
                className="w-full flex-1 rounded-2xl border border-border bg-white px-4 py-2 text-sm outline-none ring-primary/30 transition focus:ring-2"
                placeholder="Search by title, author, or ID"
                value={bookQuery}
                onChange={(event) => setBookQuery(event.target.value)}
              />
              <select
                className="rounded-2xl border border-border bg-white px-4 py-2 text-sm outline-none ring-primary/30 transition focus:ring-2"
                value={bookGenre}
                onChange={(event) => setBookGenre(event.target.value)}
              >
                <option value="all">All genres</option>
                {data.genres.map((genre) => (
                  <option key={genre.slug} value={genre.slug}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="rounded-3xl border border-border bg-white px-4 py-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-primary">
                        {book.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {book.author || "Unknown author"} - {book.genre}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {book.id}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingBookId(book.id);
                          setBookForm(book);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBookDelete(book.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "genres" ? (
        <Card className="border-primary/10 bg-white/80 shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle>Manage genres</CardTitle>
            <CardDescription>
              Update genre descriptions and landing imagery.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleGenreSubmit}>
              <div>
                <label className="text-sm font-semibold">Name</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                  value={genreForm.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setGenreForm((prev) => ({
                      ...prev,
                      name,
                      slug: prev.slug ? prev.slug : slugify(name),
                    }));
                  }}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Slug</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                  value={genreForm.slug}
                  onChange={(event) =>
                    setGenreForm((prev) => ({ ...prev, slug: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Description</label>
                <textarea
                  className="mt-2 min-h-[100px] w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                  value={genreForm.description}
                  onChange={(event) =>
                    setGenreForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Hero text</label>
                <textarea
                  className="mt-2 min-h-[100px] w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                  value={genreForm.hero}
                  onChange={(event) =>
                    setGenreForm((prev) => ({ ...prev, hero: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Image URL</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                  value={genreForm.image}
                  onChange={(event) =>
                    setGenreForm((prev) => ({ ...prev, image: event.target.value }))
                  }
                  required
                />
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full max-w-xs rounded-2xl border border-border bg-white px-3 py-2 text-xs"
                    disabled={uploadingTarget === "genre"}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      if (file) {
                        handleImageUpload("genre", file);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                  <span>
                    {uploadingTarget === "genre"
                      ? "Uploading to Cloudinary…"
                      : "Upload a new genre image directly from your device."}
                  </span>
                </div>
                {!cloudinaryConfig.cloudName ||
                !cloudinaryConfig.uploadPreset ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Cloudinary upload is not configured. Add
                    {" "}
                    <code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> and
                    {" "}
                    <code>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code>.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3 md:col-span-2">
                <Button type="submit" disabled={loading}>
                  {editingGenreSlug ? "Update genre" : "Add genre"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetGenreForm}
                >
                  Clear
                </Button>
              </div>
            </form>

            <div className="grid gap-3">
              {data.genres.map((genre) => (
                <div
                  key={genre.slug}
                  className="rounded-3xl border border-border bg-white px-4 py-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-primary">
                        {genre.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{genre.slug}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingGenreSlug(genre.slug);
                          setGenreForm(genre);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGenreDelete(genre.slug)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "featured" ? (
        <Card className="border-primary/10 bg-white/80 shadow-lg backdrop-blur">
          <CardHeader>
          <CardTitle>Today's select</CardTitle>
            <CardDescription>
              Curate the marquee list shown on the homepage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              {featuredBooks.map((book, index) => (
                <div
                  key={book.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-white px-4 py-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      {book.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{book.id}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveFeatured(index, -1)}
                    >
                      Up
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveFeatured(index, 1)}
                    >
                      Down
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setFeaturedDraft((prev) =>
                          prev.filter((id) => id !== book.id)
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleFeaturedSave} disabled={loading}>
                Save featured list
              </Button>
              <Button
                variant="outline"
                onClick={() => setFeaturedDraft(data.featured)}
              >
                Reset
              </Button>
            </div>

            <div className="rounded-3xl border border-border bg-white px-4 py-4">
              <p className="text-sm font-semibold text-primary">
                Add more picks
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {availableFeatured.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    className="rounded-2xl border border-border bg-white px-3 py-2 text-left text-sm transition hover:border-primary/40"
                    onClick={() =>
                      setFeaturedDraft((prev) => [...prev, book.id])
                    }
                  >
                    <span className="font-semibold text-primary">
                      {book.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {book.id}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "site" ? (
        <Card className="border-primary/10 bg-white/80 shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle>Site settings</CardTitle>
            <CardDescription>
              Update hero messaging, tagline, and contact details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSiteSubmit}>
              <div>
                <label className="text-sm font-semibold">Site name</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                  value={siteForm.name}
                  onChange={(event) =>
                    setSiteForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Tagline</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                  value={siteForm.tagline}
                  onChange={(event) =>
                    setSiteForm((prev) => ({ ...prev, tagline: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Hero title</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                  value={siteForm.heroTitle}
                  onChange={(event) =>
                    setSiteForm((prev) => ({
                      ...prev,
                      heroTitle: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Hero subtitle</label>
                <textarea
                  className="mt-2 min-h-[100px] w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                  value={siteForm.heroSubtitle}
                  onChange={(event) =>
                    setSiteForm((prev) => ({
                      ...prev,
                      heroSubtitle: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">About text</label>
                <textarea
                  className="mt-2 min-h-[140px] w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                  value={siteForm.about}
                  onChange={(event) =>
                    setSiteForm((prev) => ({ ...prev, about: event.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Contact email</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                  value={siteForm.contact.email}
                  onChange={(event) =>
                    setSiteForm((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, email: event.target.value },
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Contact note</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                  value={siteForm.contact.note}
                  onChange={(event) =>
                    setSiteForm((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, note: event.target.value },
                    }))
                  }
                  required
                />
              </div>
              <div className="flex flex-wrap gap-3 md:col-span-2">
                <Button type="submit" disabled={loading}>
                  Save site settings
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSiteForm(data.site)}
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "activity" ? (
        <Card className="border-primary/10 bg-white/80 shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle>Admin activity</CardTitle>
            <CardDescription>
              Recent changes made in the control room.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={fetchActivity}
                disabled={activityLoading}
              >
                Refresh activity
              </Button>
              {activityLoading ? (
                <span className="text-xs text-muted-foreground">
                  Loading activity…
                </span>
              ) : null}
            </div>
            {activityError ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
                {activityError}
              </div>
            ) : null}
            <div className="grid gap-3">
              {activity.length === 0 && !activityLoading ? (
                <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-4 text-sm text-muted-foreground">
                  No activity yet.
                </div>
              ) : null}
              {activity.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-3xl border border-border bg-white px-4 py-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {entry.summary}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.entity.toUpperCase()}
                        {entry.entityId ? ` • ${entry.entityId}` : ""}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{entry.actor}</p>
                      <p>{formatTimestamp(entry.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
