import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getDashboardReport } from "@/lib/dashboard-service";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Dashboard access code required." }, { status: 401 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limit = rateLimit(ip);
  if (limit.limited) {
    return NextResponse.json(
      { error: `Too many refresh requests. Try again in ${limit.retryAfter} seconds.` },
      { status: 429 }
    );
  }
  try {
    const force = request.nextUrl.searchParams.get("force") === "true";
    return NextResponse.json(await getDashboardReport(force), {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to retrieve the saved SkyPrep report." },
      { status: 502 }
    );
  }
}
