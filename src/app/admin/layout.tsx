import { redirect } from "next/navigation";

import { hasAdminSession } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticated = await hasAdminSession();

  if (!authenticated) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}
