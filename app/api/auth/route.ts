import { NextRequest, NextResponse } from "next/server";
import { authRequired, codeMatches, createSessionCookie, isAuthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return NextResponse.json({
    required: authRequired(),
    authenticated: isAuthorized(request)
  });
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));
  if (!codeMatches(String(payload.code || ""))) {
    return NextResponse.json({ error: "That access code did not match." }, { status: 401 });
  }
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(createSessionCookie());
  return response;
}

