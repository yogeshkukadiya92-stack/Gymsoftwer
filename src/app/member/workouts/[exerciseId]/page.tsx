import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { getDashboardData } from "@/lib/data";
import { getEmbeddableExerciseUrl, isEmbeddableIframe } from "@/lib/exercise-media";
import {
  filterNavLinksByRoutes,
  getAllowedRoutesForProfile,
  getPortalFallbackRoute,
  memberPortalRoutes,
  routeIsAllowed,
} from "@/lib/user-permissions";

export default async function MemberExerciseViewerPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const { data, viewer } = await getDashboardData("member");
  const allowedRoutes = getAllowedRoutesForProfile(viewer, data.userPermissions);
  if (!routeIsAllowed("/member/workouts", allowedRoutes)) {
    redirect(getPortalFallbackRoute(viewer, data));
  }
  const navLinks = filterNavLinksByRoutes(memberPortalRoutes, allowedRoutes);
  const exercise = data.exercises.find((item) => item.id === exerciseId);

  if (!exercise) {
    notFound();
  }

  const embedUrl = getEmbeddableExerciseUrl(exercise);
  const useIframe = isEmbeddableIframe(exercise);

  return (
    <AppShell
      role="member"
      title={exercise.name}
      subtitle="Exercise guidance, media preview, and coaching cues in one place."
      navLinks={navLinks}
    >
      <div className="grid gap-6">
        <SectionCard eyebrow={exercise.category} title="Exercise viewer">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                {exercise.difficulty} · {exercise.primaryMuscle} · {exercise.equipment}
              </p>
            </div>
            <Link
              href="/member/workouts"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Back to workouts
            </Link>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
            {exercise.mediaType === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={embedUrl}
                alt={exercise.name}
                className="h-[420px] w-full object-cover"
              />
            ) : useIframe ? (
              <iframe
                src={embedUrl}
                title={exercise.name}
                className="h-[420px] w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex h-[420px] items-center justify-center p-8">
                <a
                  href={exercise.mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  Open exercise video
                </a>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {exercise.cues.map((cue) => (
              <span
                key={cue}
                className="rounded-full bg-orange-50 px-3 py-1 text-sm text-orange-700"
              >
                {cue}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
