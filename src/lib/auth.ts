import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Profile, UserRole } from "@/lib/types";

export const adminSessionCookie = "gymflow_admin_session";

export function getConfiguredAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL ?? "",
    password: process.env.ADMIN_PASSWORD ?? "",
  };
}

export function isValidAdminLogin(email: string, password: string) {
  const configured = getConfiguredAdminCredentials();

  return (
    email.trim().toLowerCase() === configured.email.trim().toLowerCase() &&
    password === configured.password
  );
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return cookieStore.get(adminSessionCookie)?.value === "authenticated";
}

export async function getAuthenticatedProfile() {
  const hasFallbackAdmin = await hasAdminSession();

  if (hasFallbackAdmin) {
    return {
      id: "admin-fallback",
      fullName: "Admin User",
      email: getConfiguredAdminCredentials().email,
      phone: "",
      role: "admin" as UserRole,
      fitnessGoal: "",
      branch: "",
      joinedOn: new Date().toISOString().slice(0, 10),
    } satisfies Profile;
  }

  if (!hasSupabaseEnv) {
    if (!hasFallbackAdmin) {
      return null;
    }

    return null;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", user.email)
    .single();

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    fullName: profile.full_name ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    role: (profile.role ?? "member") as UserRole,
    fitnessGoal: profile.fitness_goal ?? "",
    branch: profile.branch ?? "",
    joinedOn: profile.joined_on ?? "",
  } satisfies Profile;
}

export async function requireRole(role: UserRole) {
  const profile = await getAuthenticatedProfile();

  if (!profile || profile.role !== role) {
    redirect("/sign-in");
  }

  return profile;
}

export async function signOutCurrentSession() {
  const cookieStore = await cookies();
  cookieStore.delete(adminSessionCookie);

  if (hasSupabaseEnv) {
    const supabase = await createSupabaseServerClient();
    await supabase?.auth.signOut();
    return;
  }
}

export async function createManagedUser(input: {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  fitnessGoal?: string;
  branch?: string;
}) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role key is required for user management.");
  }

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    throw new Error(authError?.message ?? "User creation failed.");
  }

  const profileId = `${input.role}-${crypto.randomUUID()}`;
  const { error: profileError } = await supabase.from("profiles").insert({
    id: profileId,
    full_name: input.fullName,
    email: input.email,
    phone: input.phone ?? "",
    role: input.role,
    fitness_goal: input.fitnessGoal ?? "",
    branch: input.branch ?? "",
    joined_on: new Date().toISOString().slice(0, 10),
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    id: profileId,
    email: input.email,
    role: input.role,
  };
}

async function findAuthUserByEmail(email: string) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role key is required for user management.");
  }

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    throw new Error(error.message);
  }

  return data.users.find(
    (user) => user.email?.trim().toLowerCase() === email.trim().toLowerCase(),
  );
}

export async function updateManagedUser(input: {
  id: string;
  currentEmail: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
  fitnessGoal?: string;
  branch?: string;
  password?: string;
}) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role key is required for user management.");
  }

  const authUser = await findAuthUserByEmail(input.currentEmail);

  if (authUser) {
    const { error: authError } = await supabase.auth.admin.updateUserById(authUser.id, {
      email: input.email,
      password: input.password?.trim() ? input.password : undefined,
    });

    if (authError) {
      throw new Error(authError.message);
    }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      email: input.email,
      role: input.role,
      phone: input.phone ?? "",
      fitness_goal: input.fitnessGoal ?? "",
      branch: input.branch ?? "",
    })
    .eq("id", input.id);

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    id: input.id,
    email: input.email,
    role: input.role,
  };
}

export async function deleteManagedUser(input: { id: string; email: string }) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role key is required for user management.");
  }

  const authUser = await findAuthUserByEmail(input.email);

  if (authUser) {
    const { error: authError } = await supabase.auth.admin.deleteUser(authUser.id);

    if (authError) {
      throw new Error(authError.message);
    }
  }

  const { error: profileError } = await supabase.from("profiles").delete().eq("id", input.id);

  if (profileError) {
    throw new Error(profileError.message);
  }

  return { id: input.id };
}
