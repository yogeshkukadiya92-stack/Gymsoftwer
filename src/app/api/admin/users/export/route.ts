import { getManagedUserLoginStatuses, requireRole } from "@/lib/auth";
import { getAppData } from "@/lib/data";
import { buildUsersWorkbook, workbookToBuffer } from "@/lib/excel";

function sortUsers(
  users: Awaited<ReturnType<typeof getAppData>>["profiles"],
  sortBy: string,
) {
  const sorted = [...users];

  switch (sortBy) {
    case "name_desc":
      sorted.sort((a, b) => b.fullName.localeCompare(a.fullName));
      break;
    case "role":
      sorted.sort((a, b) => a.role.localeCompare(b.role) || a.fullName.localeCompare(b.fullName));
      break;
    case "branch":
      sorted.sort((a, b) => a.branch.localeCompare(b.branch) || a.fullName.localeCompare(b.fullName));
      break;
    case "oldest":
      sorted.sort((a, b) => a.joinedOn.localeCompare(b.joinedOn));
      break;
    case "newest":
    default:
      sorted.sort((a, b) => b.joinedOn.localeCompare(a.joinedOn));
      break;
  }

  return sorted;
}

export async function GET(request: Request) {
  await requireRole("admin");

  const data = await getAppData();
  const loginStatuses = await getManagedUserLoginStatuses(data.profiles);
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const role = searchParams.get("role") ?? "all";
  const status = searchParams.get("status") ?? "all";
  const sortBy = searchParams.get("sort") ?? "newest";

  const accessLabelByUserId = Object.fromEntries(
    (data.userPermissions ?? []).map((entry) => [entry.userId, entry.accessLabel ?? ""]),
  );
  const loginStatusByUserId = Object.fromEntries(
    loginStatuses.map((entry) => [
      entry.userId,
      !entry.loginReady
        ? "Login not ready"
        : entry.mustResetPassword
          ? "Must reset password"
          : "Login ready",
    ]),
  );

  const filteredUsers = sortUsers(
    data.profiles.filter((user) => {
      const accessLabel = String(accessLabelByUserId[user.id] ?? "").toLowerCase();
      const loginStatus = loginStatuses.find((entry) => entry.userId === user.id);

      const matchesSearch =
        !search ||
        user.fullName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.phone.toLowerCase().includes(search) ||
        accessLabel.includes(search);

      const matchesRole = role === "all" || user.role === role;
      const matchesStatus =
        status === "all" ||
        (status === "ready" && loginStatus?.loginReady && !loginStatus.mustResetPassword) ||
        (status === "reset" && loginStatus?.mustResetPassword) ||
        (status === "not-ready" && !loginStatus?.loginReady);

      return matchesSearch && matchesRole && matchesStatus;
    }),
    sortBy,
  );
  const workbook = buildUsersWorkbook(filteredUsers, {
    accessLabels: accessLabelByUserId,
    loginStatuses: loginStatusByUserId,
  });

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-users.xlsx"',
    },
  });
}
