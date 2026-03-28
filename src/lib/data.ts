import { hasSupabaseEnv } from "@/lib/env";
import { mockData } from "@/lib/mock-data";
import { readAppDataStore } from "@/lib/app-data-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppData, Exercise, Profile, UserRole, WorkoutPlan } from "@/lib/types";

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

async function fetchSupabaseData(): Promise<AppData | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [
    profiles,
    memberships,
    exercises,
    workoutPlans,
    assignments,
    workoutLogs,
    sessions,
    attendance,
  ] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("memberships").select("*"),
    supabase.from("exercises").select("*"),
    supabase.from("workout_plans").select("*, exercises:workout_plan_exercises(*)"),
    supabase.from("member_workout_assignments").select("*"),
    supabase.from("workout_logs").select("*"),
    supabase.from("classes_or_sessions").select("*"),
    supabase.from("attendance").select("*"),
  ]);

  const results = [
    profiles,
    memberships,
    exercises,
    workoutPlans,
    assignments,
    workoutLogs,
    sessions,
    attendance,
  ];

  if (results.some((result) => result.error)) {
    return null;
  }

  return {
    profiles: (profiles.data ?? []) as AppData["profiles"],
    memberships: (memberships.data ?? []) as AppData["memberships"],
    invoices: [],
    inventoryItems: [],
    inventorySales: [],
    exercises: (exercises.data ?? []) as Exercise[],
    workoutPlans: (workoutPlans.data ?? []).map((plan) => ({
      ...plan,
      exercises: plan.exercises ?? [],
    })) as WorkoutPlan[],
    assignments: (assignments.data ?? []) as AppData["assignments"],
    workoutLogs: (workoutLogs.data ?? []) as AppData["workoutLogs"],
    progressCheckIns: [],
    progressPhotos: [],
    sessions: (sessions.data ?? []) as AppData["sessions"],
    attendance: (attendance.data ?? []) as AppData["attendance"],
  };
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
    data.profiles.find((profile) => profile.role === role) ?? data.profiles[0];

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
