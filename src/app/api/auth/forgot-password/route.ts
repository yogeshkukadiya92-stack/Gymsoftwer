import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };

  if (!body.email?.trim()) {
    return Response.json({ error: "Email is required." }, { status: 400 });
  }

  if (!hasSupabaseEnv) {
    return Response.json(
      { error: "Forgot password requires Supabase configuration." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return Response.json({ error: "Supabase client unavailable." }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const { error } = await supabase.auth.resetPasswordForEmail(body.email.trim(), {
    redirectTo: `${origin}/sign-in`,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({
    message: "Password reset email sent if the account exists.",
  });
}
