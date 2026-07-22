import { NextResponse } from "next/server";
import { authRequired } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    configured: Boolean(
      process.env.SKYPREP_API_KEY &&
      (process.env.SKYPREP_ACCOUNT_KEY || process.env.SKYPREP_ACCT_KEY)
    ),
    dashboardAccessRequired: authRequired()
  });
}
