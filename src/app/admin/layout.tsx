import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { getAppData } from "@/lib/data";
import { getPortalFallbackRoute, getAllowedRoutesForProfile, routeIsAllowed } from "@/lib/user-permissions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await requireRole("admin");
  const pathname = (await headers()).get("x-pathname") ?? "/admin";
  const data = await getAppData();
  const allowedRoutes = getAllowedRoutesForProfile(profile, data.userPermissions);

  if (!routeIsAllowed(pathname, allowedRoutes)) {
    redirect(getPortalFallbackRoute(profile, data));
  }

  return <>{children}</>;
}
