import { cookies } from "next/headers";

import { adminSessionCookie, isValidAdminLogin } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  if (!body.email || !body.password) {
    return Response.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  if (isValidAdminLogin(body.email, body.password)) {
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

    const { error } = await supabase.auth.signInWithPassword({
      email: body.email,
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
      .select("role")
      .eq("email", user?.email ?? "")
      .single();

    const redirectTo =
      profile?.role === "admin"
        ? "/admin"
        : profile?.role === "trainer"
          ? "/trainer"
          : "/member";

    return Response.json({
      message: "Login successful.",
      redirectTo,
    });
  }

  return Response.json(
    { error: "Invalid login credentials." },
    { status: 401 },
  );
}
