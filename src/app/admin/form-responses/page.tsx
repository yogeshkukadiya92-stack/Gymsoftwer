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
            Aa page live stored forms ane submitted responses batave chhe, etle public form
            submit thay pachhi ahiyan data table ma avse.
          </p>
        </SectionCard>
      </div>
    </AppShell>
  );
}
