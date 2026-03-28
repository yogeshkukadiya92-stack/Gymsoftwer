import { cookies } from "next/headers";

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
