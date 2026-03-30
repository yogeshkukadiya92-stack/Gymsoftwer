import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { getAppData } from "@/lib/data";
import { hasSupabaseEnv } from "@/lib/env";
import { getAllowedRoutesForProfile, getPortalFallbackRoute, routeIsAllowed } from "@/lib/user-permissions";

export const dynamic = "force-dynamic";

export default async function TrainerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (hasSupabaseEnv) {
    const profile = await requireRole("trainer");
    const pathname = (await headers()).get("x-pathname") ?? "/trainer";
    const data = await getAppData();
    const allowedRoutes = getAllowedRoutesForProfile(profile, data.userPermissions);

    if (!routeIsAllowed(pathname, allowedRoutes)) {
      redirect(getPortalFallbackRoute(profile, data));
    }
  }

  return <>{children}</>;
}
