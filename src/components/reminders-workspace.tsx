"use client";

import { useMemo, useState } from "react";

import { CustomWhatsAppCampaign } from "@/lib/business-data";
import { ReminderCampaign, ReminderCategory } from "@/lib/reminders";

type RemindersWorkspaceProps = {
  campaigns: ReminderCampaign[];
  customCampaigns: CustomWhatsAppCampaign[];
};

const categoryFilters: Array<ReminderCategory | "All"> = [
  "All",
  "Renewal",
  "Class",
  "Zoom",
  "Custom",
  "Form follow-up",
];

const emptyCampaignForm = {
  id: "",
  title: "",
  scheduledFor: "",
  message: "",
  recipientNames: "",
  recipientPhones: "",
  recipientNotes: "",
};

export function RemindersWorkspace({
  campaigns,
  customCampaigns: initialCustomCampaigns,
}: RemindersWorkspaceProps) {
  const [selectedCategory, setSelectedCategory] = useState<ReminderCategory | "All">("All");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaigns[0]?.id ?? "");
  const [customCampaigns, setCustomCampaigns] = useState(initialCustomCampaigns);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [formState, setFormState] = useState(emptyCampaignForm);

  const allCampaigns = useMemo(() => {
    const customMapped: ReminderCampaign[] = customCampaigns.map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
      category: "Custom",
      scheduledFor: campaign.scheduledFor,
      recipientCount: campaign.recipients.length,
      message: campaign.message,
      summary: `${campaign.recipients.length} saved recipient(s) in a custom WhatsApp automation campaign.`,
      recipients: campaign.recipients.map((recipient) => ({
        ...recipient,
        whatsappUrl: `https://wa.me/${recipient.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(campaign.message)}`,
      })),
    }));

    const nonCustom = campaigns.filter((campaign) => campaign.category !== "Custom");
    return [...nonCustom, ...customMapped];
  }, [campaigns, customCampaigns]);

  const filteredCampaigns = useMemo(() => {
    if (selectedCategory === "All") {
      return allCampaigns;
    }

    return allCampaigns.filter((campaign) => campaign.category === selectedCategory);
  }, [allCampaigns, selectedCategory]);

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

  function populateForm(campaign: CustomWhatsAppCampaign) {
    setFormState({
      id: campaign.id,
      title: campaign.title,
      scheduledFor: campaign.scheduledFor,
      message: campaign.message,
      recipientNames: campaign.recipients.map((recipient) => recipient.name).join("\n"),
      recipientPhones: campaign.recipients.map((recipient) => recipient.phone).join("\n"),
      recipientNotes: campaign.recipients.map((recipient) => recipient.note).join("\n"),
    });
    setStatusMessage(`Editing ${campaign.title}`);
  }

  function resetForm() {
    setFormState(emptyCampaignForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("");
    setIsSubmitting(true);

    const names = formState.recipientNames.split("\n").map((item) => item.trim());
    const phones = formState.recipientPhones.split("\n").map((item) => item.trim());
    const notes = formState.recipientNotes.split("\n").map((item) => item.trim());

    const recipients = names
      .map((name, index) => ({
        id: `recipient-${index + 1}`,
        name,
        phone: phones[index] ?? "",
        note: notes[index] ?? "",
      }))
      .filter((recipient) => recipient.name && recipient.phone);

    const response = await fetch("/api/admin/campaigns", {
      method: formState.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: formState.id,
        title: formState.title,
        scheduledFor: formState.scheduledFor,
        message: formState.message,
        recipients,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      campaign?: CustomWhatsAppCampaign;
    };

    if (!response.ok || !payload.campaign) {
      setStatusMessage(payload.error ?? "Campaign save failed.");
      setIsSubmitting(false);
      return;
    }

    setCustomCampaigns((current) =>
      formState.id
        ? current.map((campaign) =>
            campaign.id === payload.campaign?.id ? payload.campaign : campaign,
          )
        : [payload.campaign!, ...current],
    );
    setStatusMessage(payload.message ?? (formState.id ? "Campaign updated." : "Campaign created."));
    resetForm();
    setIsSubmitting(false);
  }

  async function handleDelete(id: string) {
    setIsDeleting(id);
    setStatusMessage("");

    const response = await fetch("/api/admin/campaigns", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const payload = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setStatusMessage(payload.error ?? "Campaign delete failed.");
      setIsDeleting(null);
      return;
    }

    setCustomCampaigns((current) => current.filter((campaign) => campaign.id !== id));
    if (selectedCampaignId === id) {
      setSelectedCampaignId("");
    }
    if (formState.id === id) {
      resetForm();
    }
    setStatusMessage(payload.message ?? "Campaign deleted.");
    setIsDeleting(null);
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-serif text-3xl text-slate-950">
            {formState.id ? "Edit custom campaign" : "Create custom campaign"}
          </h3>
          {formState.id ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Campaign title"
            value={formState.title}
            onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Scheduled for"
            value={formState.scheduledFor}
            onChange={(event) => setFormState((current) => ({ ...current, scheduledFor: event.target.value }))}
          />
          <textarea
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm lg:col-span-2"
            rows={4}
            placeholder="WhatsApp message template"
            value={formState.message}
            onChange={(event) => setFormState((current) => ({ ...current, message: event.target.value }))}
          />
          <textarea
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            rows={5}
            placeholder="Recipient names, one per line"
            value={formState.recipientNames}
            onChange={(event) => setFormState((current) => ({ ...current, recipientNames: event.target.value }))}
          />
          <textarea
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            rows={5}
            placeholder="Recipient phones, one per line"
            value={formState.recipientPhones}
            onChange={(event) => setFormState((current) => ({ ...current, recipientPhones: event.target.value }))}
          />
          <textarea
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm lg:col-span-2"
            rows={4}
            placeholder="Recipient notes, one per line"
            value={formState.recipientNotes}
            onChange={(event) => setFormState((current) => ({ ...current, recipientNotes: event.target.value }))}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{statusMessage}</p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white"
          >
            {isSubmitting ? "Saving..." : formState.id ? "Save campaign" : "Create campaign"}
          </button>
        </div>
      </form>

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
              const isCustom = campaign.category === "Custom";

              return (
                <div
                  key={campaign.id}
                  className={`rounded-[1.5rem] border p-4 transition ${
                    isActive
                      ? "border-orange-400 bg-orange-50 shadow-[0_16px_40px_rgba(249,115,22,0.12)]"
                      : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCampaignId(campaign.id)}
                    className="w-full text-left"
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
                  {isCustom ? (
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          populateForm(
                            customCampaigns.find((item) => item.id === campaign.id) as CustomWhatsAppCampaign,
                          )
                        }
                        className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(campaign.id)}
                        disabled={isDeleting === campaign.id}
                        className="rounded-full bg-rose-600 px-3 py-2 text-sm text-white disabled:opacity-60"
                      >
                        {isDeleting === campaign.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  ) : null}
                </div>
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
                  <p className="mt-2 text-sm text-slate-500">{selectedCampaign.summary}</p>
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
    </div>
  );
}
