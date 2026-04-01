import { AppShell } from "@/components/app-shell";
import { IntegrationKeysWorkspace } from "@/components/integration-keys-workspace";
import { SectionCard } from "@/components/section-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getIntegrationApiKeys } from "@/lib/integrations-store";

export default async function AdminIntegrationsPage() {
  const keys = await getIntegrationApiKeys();

  return (
    <AppShell
      role="admin"
      title="Integrations"
      subtitle="Generate API keys, export app data, and import Tally or Google Form responses into the app."
      navLinks={adminNavLinks}
    >
      <SectionCard eyebrow="API access" title="Integration keys">
        <IntegrationKeysWorkspace initialKeys={keys} />
      </SectionCard>
    </AppShell>
  );
}
