import { AppShell } from "@/components/app-shell";
import { FormsWorkspace } from "@/components/forms-workspace";
import { SectionCard } from "@/components/section-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getAllForms, getAllFormResponses } from "@/lib/forms-store";

export const dynamic = "force-dynamic";

export default async function AdminFormsPage({
  searchParams,
}: {
  searchParams?: Promise<{ formId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const initialSelectedFormId = resolvedSearchParams?.formId ?? "";
  const [forms, responses] = await Promise.all([
    getAllForms(),
    getAllFormResponses(),
  ]);

  return (
    <AppShell
      role="admin"
      title="Forms"
      subtitle="Create Google Form style intake pages, share them with clients, and review submitted information."
      navLinks={adminNavLinks}
    >
      <FormsWorkspace
        initialForms={forms}
        initialResponses={responses}
        initialSelectedFormId={initialSelectedFormId}
      />

      <div className="mt-6">
        <SectionCard eyebrow="Note" title="Current behavior">
          <p className="text-slate-700">
            Forms created here get a real shareable public link, and submitted data appears
            in the form responses page through the app store.
          </p>
        </SectionCard>
      </div>
    </AppShell>
  );
}
