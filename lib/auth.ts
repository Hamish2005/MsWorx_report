import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "hsi_dashboard_session";
const SESSION_MS = 8 * 60 * 60 * 1000;

export function authRequired() {
  return Boolean(process.env.DASHBOARD_ACCESS_CODE);
}

function secret() {
  return process.env.DASHBOARD_SESSION_SECRET || process.env.SKYPREP_API_KEY || "development-session-secret";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createSessionCookie() {
  const expiresAt = Date.now() + SESSION_MS;
  const payload = String(expiresAt);
  const token = `${payload}.${sign(payload)}`;
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MS / 1000
  };
}

export function isAuthorized(request: NextRequest) {
  if (!authRequired()) return true;
  const token = request.cookies.get(COOKIE_NAME)?.value || "";
  const [payload, signature] = token.split(".");
  if (!payload || !signature || Number(payload) < Date.now()) return false;
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function codeMatches(code: string) {
  const expected = process.env.DASHBOARD_ACCESS_CODE;
  if (!expected) return true;
  const left = Buffer.from(code);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

