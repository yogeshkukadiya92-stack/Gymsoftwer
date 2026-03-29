import { AppShell } from "@/components/app-shell";
import { FormResponsesWorkspace } from "@/components/form-responses-workspace";
import { SectionCard } from "@/components/section-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getAllForms, getAllFormResponses } from "@/lib/forms-store";

export const dynamic = "force-dynamic";

export default async function AdminFormResponsesPage() {
  const [forms, responses] = await Promise.all([
    getAllForms(),
    getAllFormResponses(),
  ]);

  return (
    <AppShell
      role="admin"
      title="Form responses"
      subtitle="Select any form and review responses in a raw, column-based table like Google Forms response sheets."
      navLinks={adminNavLinks}
    >
      <FormResponsesWorkspace forms={forms} responses={responses} />

      <div className="mt-6">
        <SectionCard eyebrow="Note" title="Current response view">
          <p className="text-slate-700">
            This page shows live stored forms and submitted responses, so public form submissions will appear here automatically.
          </p>
        </SectionCard>
      </div>
    </AppShell>
  );
}
