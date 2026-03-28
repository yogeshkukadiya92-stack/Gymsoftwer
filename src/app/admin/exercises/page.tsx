import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getAppData } from "@/lib/data";

export default async function AdminExercisesPage() {
  const data = await getAppData();

  return (
    <AppShell
      role="admin"
      title="Exercise library"
      subtitle="Admins can standardize cues, media links, equipment, and difficulty before using exercises inside plans."
      navLinks={adminNavLinks}
    >
      <SectionCard eyebrow="Content ops" title="Managed exercise catalog">
        <div className="grid gap-4">
          {data.exercises.map((exercise) => (
            <div key={exercise.id} className="rounded-[1.5rem] border border-slate-200 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
                    {exercise.category} • {exercise.difficulty}
                  </p>
                  <h2 className="mt-2 font-serif text-2xl text-slate-950">{exercise.name}</h2>
                  <p className="mt-2 text-slate-600">
                    {exercise.primaryMuscle} • {exercise.equipment}
                  </p>
                </div>
                <a
                  href={exercise.mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                >
                  Open media
                </a>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {exercise.cues.map((cue) => (
                  <span key={cue} className="rounded-full bg-orange-50 px-3 py-1 text-sm text-orange-700">
                    {cue}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
