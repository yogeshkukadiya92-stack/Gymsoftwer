import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { getDashboardData } from "@/lib/data";
import { getAllForms, getAllFormResponses } from "@/lib/forms-store";
import {
  filterNavLinksByRoutes,
  getAllowedRoutesForProfile,
  getPortalFallbackRoute,
  memberPortalRoutes,
  routeIsAllowed,
} from "@/lib/user-permissions";

export const dynamic = "force-dynamic";

export default async function MemberFormsPage() {
  const { viewer, data } = await getDashboardData("member");
  const allowedRoutes = getAllowedRoutesForProfile(viewer, data.userPermissions);

  if (!routeIsAllowed("/member/forms", allowedRoutes)) {
    redirect(getPortalFallbackRoute(viewer, data));
  }

  const navLinks = filterNavLinksByRoutes(memberPortalRoutes, allowedRoutes);
  const [forms, responses] = await Promise.all([getAllForms(), getAllFormResponses()]);
  const ownResponses = responses.filter((response) => response.memberId === viewer.id);
  const groupedResponses = forms
    .map((form) => ({
      form,
      responses: ownResponses.filter((response) => response.formId === form.id),
    }))
    .filter((entry) => entry.responses.length > 0);

  return (
    <AppShell
      role="member"
      title="My form responses"
      subtitle="Only your own submitted form responses are shown here."
      navLinks={navLinks}
    >
      <div className="grid gap-6">
        {groupedResponses.length > 0 ? (
          groupedResponses.map(({ form, responses: formResponses }) => (
            <SectionCard
              key={form.id}
              eyebrow="My responses"
              title={form.title}
            >
              <div className="space-y-4">
                <p className="text-slate-600">{form.description}</p>
                {formResponses.map((response) => (
                  <div key={response.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">{response.submittedAt}</p>
                    <div className="mt-4 grid gap-3">
                      {form.fields.map((field) => (
                        <div key={`${response.id}-${field.id}`} className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            {field.label}
                          </p>
                          <p className="mt-1 text-slate-950">
                            {response.answers[field.id] || "-"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          ))
        ) : (
          <SectionCard eyebrow="My responses" title="No submitted forms yet">
            <p className="text-slate-600">
              When you submit a form with your registered mobile number, it will appear here automatically.
            </p>
          </SectionCard>
        )}
      </div>
    </AppShell>
  );
}
