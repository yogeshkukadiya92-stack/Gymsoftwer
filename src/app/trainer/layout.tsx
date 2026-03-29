import { requireRole } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";

export default async function TrainerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (hasSupabaseEnv) {
    await requireRole("trainer");
  }

  return <>{children}</>;
}
