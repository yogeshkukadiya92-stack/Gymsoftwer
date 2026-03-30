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

export const adminPortalRoutes: PermissionOption[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/user-permissions", label: "Permissions" },
  { href: "/admin/crm", label: "Lead CRM" },
  { href: "/admin/memberships", label: "Memberships" },
  { href: "/admin/progress", label: "Progress" },
  { href: "/admin/attendance", label: "Attendance" },
  { href: "/admin/form-responses", label: "Form responses" },
  { href: "/admin/exercises", label: "Exercise library" },
  { href: "/admin/plans", label: "Workout plans" },
  { href: "/admin/diet-planner", label: "Diet planner" },
  { href: "/admin/schedule", label: "Schedule" },
  { href: "/admin/billing", label: "Billing" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/branches", label: "Branches" },
  { href: "/admin/reminders", label: "Reminders" },
  { href: "/admin/integrations", label: "Integrations" },
  { href: "/admin/data-tools", label: "Data tools" },
];

export function getPermissionOptionsForRole(role: UserRole): PermissionOption[] {
  if (role === "admin") {
    return adminPortalRoutes;
  }

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
