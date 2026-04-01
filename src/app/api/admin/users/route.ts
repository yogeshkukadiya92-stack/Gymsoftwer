import {
  createManagedUser,
  deleteManagedUser,
  getManagedUserLoginStatuses,
  requireRole,
  updateManagedUser,
} from "@/lib/auth";
import { DEFAULT_FIRST_LOGIN_PASSWORD } from "@/lib/account-policy";
import { getAppData } from "@/lib/data";

export async function GET() {
  await requireRole("admin");
  const data = await getAppData();
  const loginStatuses = await getManagedUserLoginStatuses(data.profiles);

  return Response.json({
    users: data.profiles,
    loginStatuses,
    userPermissions: data.userPermissions,
  });
}

export async function POST(request: Request) {
  await requireRole("admin");

  const body = (await request.json()) as {
    action?: "create" | "repair";
    id?: string;
    fullName?: string;
    email?: string;
    password?: string;
    role?: "member" | "trainer" | "admin";
    phone?: string;
    fitnessGoal?: string;
    branch?: string;
  };

  if (body.action === "repair") {
    if (!body.id?.trim()) {
      return Response.json({ error: "User id is required for repair." }, { status: 400 });
    }

    const data = await getAppData();
    const existingUser = data.profiles.find((profile) => profile.id === body.id);

    if (!existingUser) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    try {
      const user = await createManagedUser({
        fullName: existingUser.fullName,
        email: existingUser.email,
        password: body.password?.trim() || DEFAULT_FIRST_LOGIN_PASSWORD,
        role: existingUser.role,
        phone: existingUser.phone?.trim(),
        fitnessGoal: existingUser.fitnessGoal?.trim(),
        branch: existingUser.branch?.trim(),
      });

      return Response.json({
        message: `Login repaired successfully. Default password: ${DEFAULT_FIRST_LOGIN_PASSWORD}`,
        user,
      });
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "User repair failed." },
        { status: 400 },
      );
    }
  }

  if (!body.fullName?.trim() || !body.email?.trim() || !body.role) {
    return Response.json(
      { error: "Full name, email, and role are required." },
      { status: 400 },
    );
  }

  try {
    const user = await createManagedUser({
      fullName: body.fullName.trim(),
      email: body.email.trim(),
      password: body.password?.trim() || DEFAULT_FIRST_LOGIN_PASSWORD,
      role: body.role,
      phone: body.phone?.trim(),
      fitnessGoal: body.fitnessGoal?.trim(),
      branch: body.branch?.trim(),
    });

    return Response.json({
      message: `User created successfully. Default password: ${DEFAULT_FIRST_LOGIN_PASSWORD}`,
      user,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "User creation failed." },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  await requireRole("admin");

  const body = (await request.json()) as {
    id?: string;
    currentEmail?: string;
    fullName?: string;
    email?: string;
    password?: string;
    role?: "member" | "trainer" | "admin";
    phone?: string;
    fitnessGoal?: string;
    branch?: string;
  };

  if (!body.id?.trim() || !body.currentEmail?.trim() || !body.fullName?.trim() || !body.email?.trim() || !body.role) {
    return Response.json(
      { error: "Id, current email, full name, email, and role are required." },
      { status: 400 },
    );
  }

  try {
    const user = await updateManagedUser({
      id: body.id,
      currentEmail: body.currentEmail,
      fullName: body.fullName.trim(),
      email: body.email.trim(),
      password: body.password,
      role: body.role,
      phone: body.phone?.trim(),
      fitnessGoal: body.fitnessGoal?.trim(),
      branch: body.branch?.trim(),
    });

    return Response.json({
      message: "User updated successfully.",
      user,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "User update failed." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  await requireRole("admin");
  const body = (await request.json()) as { id?: string; email?: string };

  if (!body.id?.trim() || !body.email?.trim()) {
    return Response.json({ error: "Id and email are required." }, { status: 400 });
  }

  try {
    await deleteManagedUser({ id: body.id, email: body.email });
    return Response.json({ message: "User deleted successfully.", id: body.id });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "User delete failed." },
      { status: 400 },
    );
  }
}
