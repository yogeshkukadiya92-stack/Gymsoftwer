import { notFound } from "next/navigation";

import { ReportPrintActions } from "@/components/report-print-actions";
import { getAppData } from "@/lib/data";

type ReportPageProps = {
  params: Promise<{
    memberId: string;
  }>;
};

function formatWeightChange(firstWeight: number, lastWeight: number) {
  const delta = Number((lastWeight - firstWeight).toFixed(1));
  return `${delta > 0 ? "+" : ""}${delta} kg`;
}

export default async function AdminProgressReportPage({ params }: ReportPageProps) {
  const { memberId } = await params;
  const data = await getAppData();
  const member = data.profiles.find((profile) => profile.id === memberId);

  if (!member) {
    notFound();
  }

  const checkIns = data.progressCheckIns
    .filter((entry) => entry.memberId === memberId)
    .sort((a, b) => b.recordedOn.localeCompare(a.recordedOn));
  const photos = data.progressPhotos
    .filter((entry) => entry.memberId === memberId)
    .sort((a, b) => b.recordedOn.localeCompare(a.recordedOn));
  const logs = data.workoutLogs
    .filter((entry) => entry.memberId === memberId)
    .sort((a, b) => b.date.localeCompare(a.date));
  const latestCheckIn = checkIns[0];
  const oldestCheckIn = checkIns[checkIns.length - 1];

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-[2rem] bg-white p-8 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
                Client progress report
              </p>
              <h1 className="mt-3 font-serif text-4xl">{member.fullName}</h1>
              <p className="mt-3 text-sm text-slate-600">
                Goal: {member.fitnessGoal} • Branch: {member.branch} • Joined {member.joinedOn}
              </p>
            </div>
            <ReportPrintActions />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Latest weight</p>
              <p className="mt-2 text-2xl font-semibold">
                {latestCheckIn ? `${latestCheckIn.weightKg} kg` : "-"}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Weight change</p>
              <p className="mt-2 text-2xl font-semibold">
                {latestCheckIn && oldestCheckIn
                  ? formatWeightChange(oldestCheckIn.weightKg, latestCheckIn.weightKg)
                  : "-"}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Check-ins</p>
              <p className="mt-2 text-2xl font-semibold">{checkIns.length}</p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Photos</p>
              <p className="mt-2 text-2xl font-semibold">{photos.length}</p>
            </div>
          </div>
        </div>

        <section className="rounded-[2rem] bg-white p-8 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            Measurements
          </p>
          <h2 className="mt-2 font-serif text-2xl">Body check-in history</h2>
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Weight</th>
                  <th className="px-4 py-3 font-semibold">Waist</th>
                  <th className="px-4 py-3 font-semibold">Hips</th>
                  <th className="px-4 py-3 font-semibold">Chest</th>
                  <th className="px-4 py-3 font-semibold">Thigh</th>
                  <th className="px-4 py-3 font-semibold">Energy</th>
                </tr>
              </thead>
              <tbody>
                {checkIns.map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-200">
                    <td className="px-4 py-3">{entry.recordedOn}</td>
                    <td className="px-4 py-3">{entry.weightKg} kg</td>
                    <td className="px-4 py-3">{entry.waistCm} cm</td>
                    <td className="px-4 py-3">{entry.hipsCm} cm</td>
                    <td className="px-4 py-3">{entry.chestCm} cm</td>
                    <td className="px-4 py-3">{entry.thighCm} cm</td>
                    <td className="px-4 py-3">{entry.energyLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] bg-white p-8 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
              Trainer notes
            </p>
            <h2 className="mt-2 font-serif text-2xl">Recent observations</h2>
            <div className="mt-6 space-y-4">
              {checkIns.map((entry) => (
                <div key={entry.id} className="rounded-[1.5rem] bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{entry.recordedOn}</p>
                    <p className="text-sm text-slate-500">{entry.energyLevel} energy</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{entry.coachNote}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-8 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
              Training logs
            </p>
            <h2 className="mt-2 font-serif text-2xl">Recent sessions</h2>
            <div className="mt-6 space-y-4">
              {logs.map((log) => {
                const exercise = data.exercises.find((entry) => entry.id === log.exerciseId);

                return (
                  <div key={log.id} className="rounded-[1.5rem] bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{exercise?.name ?? "Exercise"}</p>
                      <p className="text-sm text-slate-500">{log.date}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      {log.setsCompleted} sets • {log.repsCompleted} • {log.weightKg} kg
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{log.notes}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-8 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            Photos
          </p>
          <h2 className="mt-2 font-serif text-2xl">Visual progress timeline</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {photos.map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-[1.5rem] border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageUrl}
                  alt={photo.label}
                  className="h-72 w-full object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{photo.label}</p>
                    <p className="text-sm text-slate-500">{photo.recordedOn}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{photo.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
