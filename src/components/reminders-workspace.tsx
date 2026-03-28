"use client";

import { useMemo, useState } from "react";

import { ReminderCampaign, ReminderCategory } from "@/lib/reminders";

type RemindersWorkspaceProps = {
  campaigns: ReminderCampaign[];
};

const categoryFilters: Array<ReminderCategory | "All"> = [
  "All",
  "Renewal",
  "Class",
  "Form follow-up",
];

export function RemindersWorkspace({ campaigns }: RemindersWorkspaceProps) {
  const [selectedCategory, setSelectedCategory] = useState<ReminderCategory | "All">(
    "All",
  );
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    campaigns[0]?.id ?? "",
  );

  const filteredCampaigns = useMemo(() => {
    if (selectedCategory === "All") {
      return campaigns;
    }

    return campaigns.filter((campaign) => campaign.category === selectedCategory);
  }, [campaigns, selectedCategory]);

  const selectedCampaign =
    filteredCampaigns.find((campaign) => campaign.id === selectedCampaignId) ??
    filteredCampaigns[0] ??
    null;

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Ignore clipboard failures in unsupported environments.
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {categoryFilters.map((filter) => {
            const isActive = filter === selectedCategory;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setSelectedCategory(filter);
                  setSelectedCampaignId("");
                }}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:text-orange-700"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {filteredCampaigns.map((campaign) => {
            const isActive = campaign.id === selectedCampaign?.id;

            return (
              <button
                key={campaign.id}
                type="button"
                onClick={() => setSelectedCampaignId(campaign.id)}
                className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                  isActive
                    ? "border-orange-400 bg-orange-50 shadow-[0_16px_40px_rgba(249,115,22,0.12)]"
                    : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">
                      {campaign.category}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">
                      {campaign.title}
                    </h3>
                  </div>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                    {campaign.recipientCount}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{campaign.summary}</p>
                <p className="mt-3 text-sm font-medium text-slate-700">
                  Scheduled: {campaign.scheduledFor}
                </p>
              </button>
            );
          })}

          {filteredCampaigns.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              No reminder campaigns match this filter yet.
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
        {selectedCampaign ? (
          <>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">
                  Message preview
                </p>
                <h3 className="mt-2 font-serif text-3xl text-slate-950">
                  {selectedCampaign.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {selectedCampaign.summary}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyText(selectedCampaign.message)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
              >
                Copy template
              </button>
            </div>

            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-sm leading-7 text-slate-100">
              {selectedCampaign.message}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">
                Recipients: {selectedCampaign.recipientCount}
              </p>
              <p className="text-sm text-slate-500">
                Scheduled for {selectedCampaign.scheduledFor}
              </p>
            </div>

            <div className="space-y-3">
              {selectedCampaign.recipients.map((recipient) => (
                <div
                  key={`${selectedCampaign.id}-${recipient.id}`}
                  className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-950">{recipient.name}</p>
                    <p className="text-sm text-slate-500">{recipient.phone}</p>
                    <p className="mt-1 text-sm text-slate-600">{recipient.note}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => copyText(recipient.phone)}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
                    >
                      Copy number
                    </button>
                    <a
                      href={recipient.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                    >
                      Send on WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            Select a reminder campaign to view recipients and send links.
          </div>
        )}
      </div>
    </div>
  );
}
