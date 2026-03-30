import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { getDashboardData } from "@/lib/data";
import {
  filterNavLinksByRoutes,
  getAllowedRoutesForProfile,
  getPortalFallbackRoute,
  memberPortalRoutes,
  routeIsAllowed,
} from "@/lib/user-permissions";

export default async function MemberProgressPage() {
  const { data, viewer } = await getDashboardData("member");
  const allowedRoutes = getAllowedRoutesForProfile(viewer, data.userPermissions);
  if (!routeIsAllowed("/member/progress", allowedRoutes)) {
    redirect(getPortalFallbackRoute(viewer, data));
  }
  const navLinks = filterNavLinksByRoutes(memberPortalRoutes, allowedRoutes);
  const logs = data.workoutLogs.filter((entry) => entry.memberId === viewer.id);
  const checkIns = data.progressCheckIns
    .filter((entry) => entry.memberId === viewer.id)
    .sort((a, b) => b.recordedOn.localeCompare(a.recordedOn));
  const latestCheckIn = checkIns[0];
  const oldestCheckIn = checkIns[checkIns.length - 1];
  const photos = data.progressPhotos
    .filter((entry) => entry.memberId === viewer.id)
    .sort((a, b) => b.recordedOn.localeCompare(a.recordedOn));
  const weightChange =
    latestCheckIn && oldestCheckIn
      ? Number((latestCheckIn.weightKg - oldestCheckIn.weightKg).toFixed(1))
      : 0;

  return (
    <AppShell
      role="member"
      title="Progress history"
      subtitle="Track workout consistency, body measurements, progress photos, and trainer feedback from one place."
      navLinks={navLinks}
    >
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Latest weight</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {latestCheckIn ? `${latestCheckIn.weightKg} kg` : "-"}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Weight change</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {latestCheckIn && oldestCheckIn
              ? `${weightChange > 0 ? "+" : ""}${weightChange} kg`
              : "-"}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Check-ins</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{checkIns.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Progress photos</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{photos.length}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard eyebrow="Measurements" title="Body check-ins">
          <div className="space-y-4">
            {checkIns.map((entry) => (
              <div key={entry.id} className="rounded-[1.5rem] bg-slate-50 p-5">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{entry.recordedOn}</p>
                    <p className="text-sm text-slate-600">
                      Energy level: {entry.energyLevel}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-orange-700">
                    {entry.weightKg} kg
                  </p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <p className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700">
                    Waist {entry.waistCm} cm
                  </p>
                  <p className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700">
                    Hips {entry.hipsCm} cm
                  </p>
                  <p className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700">
                    Chest {entry.chestCm} cm
                  </p>
                  <p className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700">
                    Thigh {entry.thighCm} cm
                  </p>
                </div>
                <p className="mt-4 text-sm text-slate-600">{entry.coachNote}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Photos" title="Visual progress and notes">
          <div className="space-y-4">
            {photos.map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-[1.5rem] border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageUrl}
                  alt={photo.label}
                  className="h-52 w-full object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{photo.label}</p>
                    <p className="text-sm text-slate-500">{photo.recordedOn}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{photo.note}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard eyebrow="Workout logs" title="Recent training entries">
          <div className="space-y-4">
            {logs.map((log) => {
              const exercise = data.exercises.find((entry) => entry.id === log.exerciseId);

              return (
                <div key={log.id} className="rounded-[1.5rem] bg-slate-50 p-5">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{exercise?.name}</p>
                      <p className="text-sm text-slate-600">{log.date}</p>
                    </div>
                    <p className="text-sm font-semibold text-orange-700">{log.weightKg} kg</p>
                  </div>
                  <p className="mt-3 text-slate-700">
                    {log.setsCompleted} sets completed, rep pattern: {log.repsCompleted}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{log.notes}</p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
