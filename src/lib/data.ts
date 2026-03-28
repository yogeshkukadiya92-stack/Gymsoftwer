import { hasSupabaseEnv } from "@/lib/env";
import { mockData } from "@/lib/mock-data";
import { readAppDataStore } from "@/lib/app-data-store";
import { readSupabaseAppData } from "@/lib/supabase/persistence";
import { AppData, Profile, UserRole, WorkoutPlan } from "@/lib/types";

type DashboardData = {
  data: AppData;
  viewer: Profile;
  assignedPlan?: WorkoutPlan;
  membershipStatus?: string;
  completedSessions: number;
  bookedClasses: number;
  activeMembers: number;
  activePlans: number;
};

function buildFallbackViewer(role: UserRole): Profile {
  return {
    id: `${role}-fallback`,
    fullName: role === "admin" ? "Admin User" : role === "trainer" ? "Trainer User" : "Member User",
    email: "",
    phone: "",
    role,
    fitnessGoal: "",
    branch: "",
    joinedOn: new Date().toISOString().slice(0, 10),
  };
}

async function fetchSupabaseData(): Promise<AppData | null> {
  return readSupabaseAppData();
}

export async function getAppData() {
  if (hasSupabaseEnv) {
    const supabaseData = await fetchSupabaseData();

    if (supabaseData) {
      return supabaseData;
    }
  }

  try {
    return await readAppDataStore();
  } catch {
    return mockData;
  }
}

export async function getDashboardData(role: UserRole): Promise<DashboardData> {
  const data = await getAppData();
  const viewer =
    data.profiles.find((profile) => profile.role === role) ??
    data.profiles[0] ??
    buildFallbackViewer(role);

  const membership = data.memberships.find(
    (item) => item.memberId === viewer.id,
  );
  const assignment = data.assignments.find((item) => item.memberId === viewer.id);
  const assignedPlan = data.workoutPlans.find((plan) => plan.id === assignment?.planId);

  return {
    data,
    viewer,
    assignedPlan,
    membershipStatus: membership?.status,
    completedSessions: data.workoutLogs.filter((log) => log.memberId === viewer.id)
      .length,
    bookedClasses: data.attendance.filter(
      (entry) => entry.memberId === viewer.id && entry.status !== "Missed",
    ).length,
    activeMembers: data.memberships.filter((item) => item.status === "Active").length,
    activePlans: data.assignments.filter((item) => item.status === "Active").length,
  };
}
