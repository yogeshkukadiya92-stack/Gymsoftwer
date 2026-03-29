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
      subtitle="API key generate karo ane app nu data secure rite biji systems sathe connect karo."
      navLinks={adminNavLinks}
    >
      <SectionCard eyebrow="API access" title="Integration keys">
        <IntegrationKeysWorkspace initialKeys={keys} />
      </SectionCard>
    </AppShell>
  );
}
