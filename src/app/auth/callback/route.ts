import { NextResponse } from "next/server";

import { getAppBaseUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/reset-password";
  const baseUrl = getAppBaseUrl(request.url);

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/sign-in?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(`${baseUrl}/sign-in?error=supabase_unavailable`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/sign-in?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${baseUrl}${next}`);
}
