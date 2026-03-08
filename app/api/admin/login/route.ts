import { NextResponse } from "next/server";

import {
  adminCookieOptions,
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  verifyAdminCredentials,
} from "@/lib/auth";

export async function POST(request: Request) {
  let email = "";
  let password = "";

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { email?: string; password?: string };
    email = body.email?.trim() ?? "";
    password = body.password ?? "";
  } else {
    const form = await request.formData();
    email = String(form.get("email") ?? "").trim();
    password = String(form.get("password") ?? "");
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  if (!verifyAdminCredentials(email, password)) {
    return NextResponse.json(
      { error: "Invalid admin credentials." },
      { status: 401 }
    );
  }

  try {
    const token = createAdminSession(email);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, adminCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed." },
      { status: 500 }
    );
  }
}
