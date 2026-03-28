import { requireRole } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";

export default async function MemberLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (hasSupabaseEnv) {
    await requireRole("member");
  }

  return <>{children}</>;
}
