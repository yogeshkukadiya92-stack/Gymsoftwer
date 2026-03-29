import { AppShell } from "@/components/app-shell";
import { LeadCrmWorkspace } from "@/components/lead-crm-workspace";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getLeadRecords } from "@/lib/business-data-store";

export default async function AdminCrmPage() {
  const leads = await getLeadRecords();
  const newLeads = leads.filter((lead) => lead.status === "New").length;
  const convertedLeads = leads.filter((lead) => lead.status === "Converted").length;
  const trials = leads.filter((lead) => lead.status === "Trial Booked").length;

  return (
    <AppShell
      role="admin"
      title="Lead CRM"
      subtitle="Track new inquiries, follow-ups, trials, and conversions from one funnel board."
      navLinks={adminNavLinks}
    >
      <div className="grid gap-6 lg:grid-cols-4">
        <StatCard label="Total leads" value={String(leads.length)} detail="All active inquiry records in your CRM." />
        <StatCard label="New" value={String(newLeads)} detail="Fresh leads waiting for first contact." />
        <StatCard label="Trials" value={String(trials)} detail="Leads who already booked a trial class." />
        <StatCard label="Converted" value={String(convertedLeads)} detail="Leads turned into paying clients." />
      </div>

      <div className="mt-6">
        <SectionCard eyebrow="Pipeline" title="Lead board">
          <LeadCrmWorkspace leads={leads} />
        </SectionCard>
      </div>
    </AppShell>
  );
}
