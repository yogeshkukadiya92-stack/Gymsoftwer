import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getBranchOverview } from "@/lib/branch-utils";
import { getAppData } from "@/lib/data";

export default async function AdminBranchesPage() {
  const data = await getAppData();
  const branches = getBranchOverview(data);
  const totalVisits = branches.reduce((sum, branch) => sum + branch.visits.length, 0);

  return (
    <AppShell
      role="admin"
      title="Branches"
      subtitle="Multiple gym branches nu overview, members, sessions, ane visit activity ekaj page par."
      navLinks={adminNavLinks}
    >
      <div className="grid gap-6 lg:grid-cols-4">
        <StatCard label="Branches" value={String(branches.length)} detail="All gym branches and online studios." />
        <StatCard
          label="Members mapped"
          value={String(branches.reduce((sum, branch) => sum + branch.members.length, 0))}
          detail="Users grouped by their home branch."
        />
        <StatCard
          label="Active memberships"
          value={String(branches.reduce((sum, branch) => sum + branch.activeMemberships, 0))}
          detail="Branch-wise live memberships."
        />
        <StatCard label="Visits tracked" value={String(totalVisits)} detail="Cross-branch activity and attendance visits." />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {branches.map(({ branch, members, sessions, visits, activeMemberships }) => (
          <SectionCard
            key={branch.id}
            eyebrow={branch.kind}
            title={branch.name}
          >
            <p className="mb-5 text-sm text-slate-500">
              {branch.city || "City pending"} - {branch.address || "Address pending"}
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-orange-600">Members</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{members.length}</p>
              </div>
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-orange-600">Sessions</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{sessions.length}</p>
              </div>
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-orange-600">Active plans</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{activeMemberships}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Members in this branch
                </h3>
                <div className="mt-3 space-y-3">
                  {members.length > 0 ? (
                    members.slice(0, 6).map((member) => (
                      <div key={member.id} className="rounded-[1.25rem] bg-slate-50 p-4">
                        <p className="font-semibold text-slate-950">{member.fullName}</p>
                        <p className="mt-1 text-sm text-slate-500">{member.role} · {member.phone}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.25rem] bg-slate-50 p-4 text-sm text-slate-500">
                      Haju aa branch mate member mapping nathi.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Session and visit activity
                </h3>
                <div className="mt-3 space-y-3">
                  {sessions.slice(0, 4).map((session) => (
                    <div key={session.id} className="rounded-[1.25rem] bg-slate-50 p-4">
                      <p className="font-semibold text-slate-950">{session.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {session.day} · {session.time} · {session.coach}
                      </p>
                    </div>
                  ))}
                  <div className="rounded-[1.25rem] bg-slate-50 p-4">
                    <p className="font-semibold text-slate-950">Tracked visits</p>
                    <p className="mt-1 text-sm text-slate-500">{visits.length} branch visits recorded</p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </AppShell>
  );
}
