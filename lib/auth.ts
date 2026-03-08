import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual, scryptSync } from "crypto";

export const ADMIN_SESSION_COOKIE = "booknest_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

interface AdminSession {
  sub: string;
  exp: number;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET for admin authentication.");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function encodeSession(session: AdminSession) {
  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function decodeSession(token: string): AdminSession | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }
  const expected = sign(payload);
  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as AdminSession;
    if (parsed.exp <= Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function constantTimeEquals(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

export function verifyAdminCredentials(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !constantTimeEquals(adminEmail, email)) {
    return false;
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  const salt = process.env.ADMIN_PASSWORD_SALT;
  if (hash && salt) {
    const derived = scryptSync(password, salt, 64).toString("hex");
    return constantTimeEquals(hash, derived);
  }

  const plain = process.env.ADMIN_PASSWORD;
  if (!plain) {
    return false;
  }

  return constantTimeEquals(plain, password);
}

export function createAdminSession(email: string) {
  const session: AdminSession = {
    sub: email,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  return encodeSession(session);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return decodeSession(token);
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function clearAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
