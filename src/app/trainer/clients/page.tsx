import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { TrainerNotesWorkspace } from "@/components/trainer-notes-workspace";
import { getTrainerNotes } from "@/lib/business-data-store";
import { getDashboardData } from "@/lib/data";
import {
  filterNavLinksByRoutes,
  getAllowedRoutesForProfile,
  getPortalFallbackRoute,
  routeIsAllowed,
  trainerPortalRoutes,
} from "@/lib/user-permissions";

export default async function TrainerClientsPage() {
  const [{ data, viewer }, trainerNotes] = await Promise.all([getDashboardData("trainer"), getTrainerNotes()]);
  const allowedRoutes = getAllowedRoutesForProfile(viewer, data.userPermissions);
  if (!routeIsAllowed("/trainer/clients", allowedRoutes)) {
    redirect(getPortalFallbackRoute(viewer, data));
  }
  const trainerNavLinks = filterNavLinksByRoutes(trainerPortalRoutes, allowedRoutes);
  const clients = data.profiles.filter((profile) => profile.role === "member");

  return (
    <AppShell
      role="trainer"
      title="Trainer client roster"
      subtitle="Quickly review member goals, contact details, and current readiness before your sessions."
      navLinks={trainerNavLinks}
    >
      <SectionCard eyebrow="Clients" title="Member list">
        <div className="grid gap-4 lg:grid-cols-2">
          {clients.map((client) => (
            <div key={client.id} className="rounded-[1.5rem] border border-slate-200 p-5">
              <p className="font-semibold text-slate-950">{client.fullName}</p>
              <p className="mt-1 text-sm text-slate-600">{client.fitnessGoal}</p>
              <div className="mt-4 grid gap-2 text-sm text-slate-500">
                <p>{client.email}</p>
                <p>{client.phone}</p>
                <p>{client.branch}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="mt-6">
        <SectionCard eyebrow="Notes" title="Trainer notes and follow-ups">
          <TrainerNotesWorkspace members={clients} notes={trainerNotes} />
        </SectionCard>
      </div>
    </AppShell>
  );
}
