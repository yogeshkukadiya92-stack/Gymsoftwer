import { cookies } from "next/headers";

import { adminSessionCookie, findProfileByLoginIdentifier, isValidAdminLogin } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    identifier?: string;
    email?: string;
    password?: string;
  };
  const identifier = body.identifier?.trim() || body.email?.trim() || "";

  if (!identifier || !body.password) {
    return Response.json(
      { error: "Email or phone and password are required." },
      { status: 400 },
    );
  }

  if (isValidAdminLogin(identifier, body.password)) {
    const cookieStore = await cookies();
    cookieStore.set(adminSessionCookie, "authenticated", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return Response.json({
      message: "Login successful.",
      redirectTo: "/admin",
    });
  }

  if (hasSupabaseEnv) {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return Response.json({ error: "Supabase client unavailable." }, { status: 500 });
    }

    const matchedProfile = await findProfileByLoginIdentifier(identifier).catch(() => null);
    const loginEmail = matchedProfile?.email ?? identifier;

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: body.password,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", user?.email ?? "")
      .single();

    const mustResetPassword = Boolean(user?.user_metadata?.must_reset_password);
    const roleRedirect =
      profile?.role === "admin"
        ? "/admin"
        : profile?.role === "trainer"
          ? "/trainer"
          : "/member";

    return Response.json({
      message: "Login successful.",
      redirectTo: mustResetPassword ? "/reset-password" : roleRedirect,
    });
  }

  return Response.json(
    { error: "Invalid login credentials." },
    { status: 401 },
  );
}
