"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.error ?? "Invalid credentials.");
        setLoading(false);
        return;
      }

      window.location.href = "/admin";
    } catch (err) {
      setError("Unable to sign in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl border-primary/20 bg-white/80 shadow-2xl backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="font-display text-3xl text-primary">
          Admin access
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sign in to manage books, genres, and featured picks.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-semibold">Email</label>
            <input
              className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Password</label>
            <div className="relative mt-2">
              <input
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 pr-16 text-sm outline-none ring-primary/30 transition focus:ring-2"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary/70 transition hover:text-primary"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <div className="rounded-2xl border border-dashed border-border bg-white px-4 py-3 text-xs text-muted-foreground">
            This console is protected. Only approved admins should continue.
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
