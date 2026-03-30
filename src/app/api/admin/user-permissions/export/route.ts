import { requireRole } from "@/lib/auth";
import { getAppData } from "@/lib/data";
import { buildUserPermissionsWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET(request: Request) {
  await requireRole("admin");

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const role = searchParams.get("role")?.trim() ?? "All roles";
  const access = searchParams.get("access")?.trim() ?? "All access";
  const sort = searchParams.get("sort")?.trim() ?? "name";

  const data = await getAppData();
  const filteredProfiles = data.profiles
    .filter((profile) => {
      const permission = data.userPermissions.find((item) => item.userId === profile.id);
      const accessLabel = permission?.accessLabel ?? "";
      const matchesSearch =
        !search ||
        [profile.fullName, profile.email, profile.phone, profile.branch, accessLabel]
          .join(" ")
          .toLowerCase()
          .includes(search);
      const matchesRole = role === "All roles" || profile.role === role;
      const matchesAccess =
        access === "All access" ||
        (access === "With custom access label" ? Boolean(accessLabel.trim()) : !accessLabel.trim());

      return matchesSearch && matchesRole && matchesAccess;
    })
    .sort((a, b) => {
      const permissionA = data.userPermissions.find((item) => item.userId === a.id);
      const permissionB = data.userPermissions.find((item) => item.userId === b.id);

      switch (sort) {
        case "role":
          return a.role.localeCompare(b.role) || a.fullName.localeCompare(b.fullName);
        case "access":
          return (
            (permissionA?.accessLabel ?? "").localeCompare(permissionB?.accessLabel ?? "") ||
            a.fullName.localeCompare(b.fullName)
          );
        case "branch":
          return a.branch.localeCompare(b.branch) || a.fullName.localeCompare(b.fullName);
        case "name":
        default:
          return a.fullName.localeCompare(b.fullName);
      }
    });

  const workbook = buildUserPermissionsWorkbook(filteredProfiles, data.userPermissions);

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-user-permissions.xlsx"',
    },
  });
}
