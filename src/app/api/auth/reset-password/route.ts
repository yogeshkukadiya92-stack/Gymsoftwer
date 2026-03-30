import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    password?: string;
  };

  if (!body.password?.trim() || body.password.trim().length < 6) {
    return Response.json(
      { error: "Please enter a password with at least 6 characters." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return Response.json({ error: "Supabase client unavailable." }, { status: 500 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return Response.json({ error: "Please sign in again to reset your password." }, { status: 401 });
  }

  const { error: resetError } = await supabase.auth.updateUser({
    password: body.password.trim(),
    data: {
      ...(user.user_metadata ?? {}),
      must_reset_password: false,
    },
  });

  if (resetError) {
    return Response.json({ error: resetError.message }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("email", user.email)
    .single();

  const redirectTo =
    profile?.role === "admin"
      ? "/admin"
      : profile?.role === "trainer"
        ? "/trainer"
        : "/member";

  return Response.json({
    message: "Password updated successfully.",
    redirectTo,
  });
}
