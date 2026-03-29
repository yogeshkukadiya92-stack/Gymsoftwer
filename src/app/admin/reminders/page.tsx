import { AppShell } from "@/components/app-shell";
import { RemindersWorkspace } from "@/components/reminders-workspace";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getAppData } from "@/lib/data";
import { getAllForms, getAllFormResponses } from "@/lib/forms-store";
import { buildReminderCampaigns, getReminderStats } from "@/lib/reminders";

export default async function AdminRemindersPage() {
  const [data, forms, responses] = await Promise.all([
    getAppData(),
    getAllForms(),
    getAllFormResponses(),
  ]);

  const campaigns = buildReminderCampaigns(data, forms, responses);
  const stats = getReminderStats(campaigns);

  return (
    <AppShell
      role="admin"
      title="WhatsApp and reminders"
      subtitle="Prepare renewal nudges, class reminders, and form follow-ups with ready-to-send WhatsApp links for every client."
      navLinks={adminNavLinks}
    >
      <div className="grid gap-6 lg:grid-cols-4">
        <StatCard
          label="Campaigns"
          value={String(campaigns.length)}
          detail="Ready reminder lists generated from billing, classes, and forms."
        />
        <StatCard
          label="Recipients"
          value={String(stats.totalRecipients)}
          detail="Total people available across all reminder campaigns."
        />
        <StatCard
          label="Renewals"
          value={String(stats.renewalCount)}
          detail="Payment and membership follow-up campaigns."
        />
        <StatCard
          label="Class nudges"
          value={String(stats.classCount)}
          detail="Booked attendees who should receive session reminders."
        />
        <StatCard
          label="Zoom joins"
          value={String(stats.zoomCount)}
          detail="Campaigns ready with direct Zoom join links."
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
        <SectionCard eyebrow="Workflow" title="Reminder control center">
          <div className="space-y-4 text-sm text-slate-600">
            <p>
              This page groups together payment follow-ups, class attendance reminders,
              and form completion nudges so you can send them quickly without rewriting
              the message every time.
            </p>
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">How to use it</p>
              <ul className="mt-3 space-y-2">
                <li>1. Pick a reminder type or campaign from the left side.</li>
                <li>2. Review the message template and recipient list.</li>
                <li>3. Click `Send on WhatsApp` for each client.</li>
                <li>4. Copy the template if you want to send the same text elsewhere.</li>
              </ul>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">
                  Form follow-ups
                </p>
                <p className="mt-2 text-slate-700">
                  {stats.followUpCount} campaign(s) ready for clients who still need to
                  submit a form.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">
                  Zoom nudges
                </p>
                <p className="mt-2 text-slate-700">
                  {stats.zoomCount} Zoom join campaign(s) are ready for one-tap WhatsApp delivery.
                </p>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">
                Automation ideas
              </p>
              <p className="mt-2 text-slate-700">
                Use these campaigns as your daily WhatsApp automation queue for renewals, join reminders,
                trial follow-ups, and incomplete forms.
              </p>
            </div>
          </div>
        </SectionCard>

        <RemindersWorkspace campaigns={campaigns} />
      </div>
    </AppShell>
  );
}
