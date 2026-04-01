"use client";

import { useState } from "react";

import {
  integrationDatasets,
  type IntegrationApiKey,
  type IntegrationDataset,
} from "@/lib/integrations";

type IntegrationKeysWorkspaceProps = {
  initialKeys: IntegrationApiKey[];
};

export function IntegrationKeysWorkspace({
  initialKeys,
}: IntegrationKeysWorkspaceProps) {
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<IntegrationDataset[]>([
    ...integrationDatasets,
  ]);
  const [statusMessage, setStatusMessage] = useState("");
  const [plainKey, setPlainKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);

  function toggleScope(scope: IntegrationDataset) {
    setSelectedScopes((current) =>
      current.includes(scope)
        ? current.filter((item) => item !== scope)
        : [...current, scope],
    );
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("");
    setPlainKey("");
    setIsSubmitting(true);

    const response = await fetch("/api/admin/integrations/keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        scopes: selectedScopes,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      key?: IntegrationApiKey;
      plainKey?: string;
    };

    if (!response.ok || !payload.key || !payload.plainKey) {
      setStatusMessage(payload.error ?? "API key create failed.");
      setIsSubmitting(false);
      return;
    }

    setKeys((current) => [payload.key!, ...current]);
    setPlainKey(payload.plainKey);
    setStatusMessage(payload.message ?? "API key created.");
    setName("");
    setSelectedScopes([...integrationDatasets]);
    setIsSubmitting(false);
  }

  async function handleRevoke(id: string) {
    setIsRevoking(id);
    setStatusMessage("");

    const response = await fetch("/api/admin/integrations/keys", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      key?: IntegrationApiKey;
    };

    if (!response.ok || !payload.key) {
      setStatusMessage(payload.error ?? "API key revoke failed.");
      setIsRevoking(null);
      return;
    }

    setKeys((current) => current.map((item) => (item.id === id ? payload.key! : item)));
    setStatusMessage(payload.message ?? "API key revoked.");
    setIsRevoking(null);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={handleCreate}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]"
        >
          <h3 className="font-serif text-2xl text-slate-950">Create integration API key</h3>
          <p className="mt-2 text-sm text-slate-500">
            Use this key to fetch app data from an external app, Google Apps Script, Zapier, or a custom dashboard.
          </p>

          <div className="mt-4 grid gap-4">
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Key name, example: Power BI sync"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <div className="rounded-[1.25rem] border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-950">Allowed datasets</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {integrationDatasets.map((scope) => {
                  const active = selectedScopes.includes(scope);

                  return (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => toggleScope(scope)}
                      className={`rounded-full px-3 py-2 text-sm transition ${
                        active
                          ? "bg-slate-950 text-white"
                          : "border border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {scope}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{statusMessage}</p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white"
            >
              {isSubmitting ? "Creating..." : "Create API key"}
            </button>
          </div>

          {plainKey ? (
            <div className="mt-5 rounded-[1.25rem] border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm font-medium text-orange-900">Copy this key now</p>
              <p className="mt-2 break-all rounded-2xl bg-white px-4 py-3 text-sm text-slate-900">
                {plainKey}
              </p>
              <p className="mt-2 text-xs text-orange-800">
                This plain key will not be shown again. Save it somewhere secure.
              </p>
            </div>
          ) : null}
        </form>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
            <h3 className="font-serif text-2xl text-slate-950">Integration endpoint</h3>
            <p className="mt-2 text-sm text-slate-500">
              `GET /api/integrations/data?datasets=profiles,memberships`
            </p>
            <div className="mt-4 rounded-[1.25rem] bg-slate-50 p-4 text-sm text-slate-700">
              <p>Use this header: `x-api-key: YOUR_KEY`</p>
              <p className="mt-2">Or: `Authorization: Bearer YOUR_KEY`</p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
            <h3 className="font-serif text-2xl text-slate-950">
              Tally and Google Forms import
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Send external form submissions directly into GymFlow so they appear in
              `Form responses`.
            </p>
            <div className="mt-4 rounded-[1.25rem] bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-medium text-slate-900">
                `POST /api/integrations/forms/import`
              </p>
              <p className="mt-2">
                Friendly aliases: `POST /api/integrations/forms/tally` and `POST
                /api/integrations/forms/google`
              </p>
              <p className="mt-2">Required API key scope: `forms` or `formResponses`</p>
              <p className="mt-2">Sample JSON payload:</p>
              <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950/95 p-4 text-xs text-slate-100">
{`{
  "source": "tally",
  "form": {
    "id": "tally-form-001",
    "title": "Workshop Registration",
    "description": "Imported from Tally submissions",
    "audience": "External leads"
  },
  "response": {
    "answers": {
      "Full name": "Riya Patel",
      "Phone": "+91 9876543210",
      "Email": "riya@example.com",
      "Goal": "Weight loss"
    }
  }
}`}
              </pre>
              <p className="mt-3">
                The system will create the form if it does not exist and store the
                imported response automatically.
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
            <h3 className="font-serif text-2xl text-slate-950">Existing API keys</h3>
            <div className="mt-4 space-y-3">
              {keys.map((key) => (
                <div key={key.id} className="rounded-[1.25rem] bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">{key.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Prefix: {key.keyPrefix} · Status: {key.status}
                      </p>
                    </div>
                    {key.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => handleRevoke(key.id)}
                        disabled={isRevoking === key.id}
                        className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white"
                      >
                        {isRevoking === key.id ? "Revoking..." : "Revoke"}
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Scopes: {key.scopes.join(", ")}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Created: {key.createdAt || "Unknown"} | Last used: {key.lastUsedAt || "Never"}
                  </p>
                </div>
              ))}
              {keys.length === 0 ? (
                <div className="rounded-[1.25rem] bg-slate-50 p-4 text-sm text-slate-500">
                  No integration API keys have been created yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
