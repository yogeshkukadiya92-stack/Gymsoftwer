const requiredSupabaseVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export const hasSupabaseEnv = requiredSupabaseVars.every(
  (key) => !!process.env[key],
);

export const appConfig = {
  name: "GymFlow",
  description:
    "A web-first gym operations and member training platform for workouts, schedules, memberships, and staff workflows.",
};

export function getAppBaseUrl(requestUrl?: string) {
  const configured =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.RAILWAY_PUBLIC_DOMAIN;

  if (configured) {
    const normalized = configured.startsWith("http")
      ? configured
      : `https://${configured}`;

    return normalized.replace(/\/+$/, "");
  }

  if (requestUrl) {
    return new URL(requestUrl).origin;
  }

  return "http://localhost:3000";
}
