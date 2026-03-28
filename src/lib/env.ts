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
