import { AppData, Profile, UserPermission, UserRole } from "@/lib/types";

type PermissionOption = {
  href: string;
  label: string;
};

export const memberPortalRoutes: PermissionOption[] = [
  { href: "/member", label: "Overview" },
  { href: "/member/workouts", label: "Workouts" },
  { href: "/member/progress", label: "Progress" },
  { href: "/member/schedule", label: "Schedule" },
  { href: "/member/profile", label: "Profile" },
];

export const trainerPortalRoutes: PermissionOption[] = [
  { href: "/trainer", label: "Overview" },
  { href: "/trainer/clients", label: "Clients" },
  { href: "/trainer/schedule", label: "Schedule" },
];

export function getPermissionOptionsForRole(role: UserRole): PermissionOption[] {
  if (role === "trainer") {
    return trainerPortalRoutes;
  }

  if (role === "member") {
    return memberPortalRoutes;
  }

  return [];
}

export function getDefaultAllowedRoutes(role: UserRole) {
  return getPermissionOptionsForRole(role).map((item) => item.href);
}

export function getAllowedRoutesForProfile(profile: Profile, permissions: UserPermission[]) {
  const entry = permissions.find((item) => item.userId === profile.id);
  const defaults = getDefaultAllowedRoutes(profile.role);

  if (!entry || entry.allowedRoutes.length === 0) {
    return defaults;
  }

  return entry.allowedRoutes;
}

export function routeIsAllowed(route: string, allowedRoutes: string[]) {
  return allowedRoutes.some((allowedRoute) => {
    if (route === allowedRoute) {
      return true;
    }

    return route.startsWith(`${allowedRoute}/`);
  });
}

export function filterNavLinksByRoutes<T extends { href: string }>(
  links: T[],
  allowedRoutes: string[],
) {
  return links.filter((link) => routeIsAllowed(link.href, allowedRoutes));
}

export function getPortalFallbackRoute(profile: Profile, data: AppData) {
  const allowedRoutes = getAllowedRoutesForProfile(profile, data.userPermissions ?? []);
  return allowedRoutes[0] ?? (profile.role === "trainer" ? "/trainer" : "/member");
}
