import { getBusinessStore } from "@/lib/business-data-store";
import { getAppData } from "@/lib/data";
import { getAllForms, getAllFormResponses } from "@/lib/forms-store";
import { integrationDatasets, type IntegrationDataset } from "@/lib/integrations";
import { validateIntegrationApiKey } from "@/lib/integrations-store";

function extractApiKey(request: Request) {
  const headerKey = request.headers.get("x-api-key");

  if (headerKey?.trim()) {
    return headerKey.trim();
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

export async function GET(request: Request) {
  const rawKey = extractApiKey(request);

  if (!rawKey) {
    return Response.json({ error: "Missing API key." }, { status: 401 });
  }

  const apiKey = await validateIntegrationApiKey(rawKey);

  if (!apiKey) {
    return Response.json({ error: "Invalid API key." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedDatasets = (searchParams.get("datasets") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is IntegrationDataset =>
      integrationDatasets.includes(item as IntegrationDataset),
    );
  const datasets = requestedDatasets.length > 0 ? requestedDatasets : apiKey.scopes;
  const allowedDatasets = datasets.filter((dataset) => apiKey.scopes.includes(dataset));
  const appData = await getAppData();
  const businessStore = await getBusinessStore();
  const [forms, formResponses] = await Promise.all([getAllForms(), getAllFormResponses()]);

  const payload = {
    generatedAt: new Date().toISOString(),
    datasets: {} as Record<string, unknown>,
  };

  allowedDatasets.forEach((dataset) => {
    switch (dataset) {
      case "profiles":
        payload.datasets[dataset] = appData.profiles;
        break;
      case "memberships":
        payload.datasets[dataset] = appData.memberships;
        break;
      case "sessions":
        payload.datasets[dataset] = appData.sessions;
        break;
      case "attendance":
        payload.datasets[dataset] = appData.attendance;
        break;
      case "forms":
        payload.datasets[dataset] = forms;
        break;
      case "formResponses":
        payload.datasets[dataset] = formResponses;
        break;
      case "inventoryItems":
        payload.datasets[dataset] = appData.inventoryItems;
        break;
      case "inventorySales":
        payload.datasets[dataset] = appData.inventorySales;
        break;
      case "workoutPlans":
        payload.datasets[dataset] = appData.workoutPlans;
        break;
      case "workoutLogs":
        payload.datasets[dataset] = appData.workoutLogs;
        break;
      case "gymBranches":
        payload.datasets[dataset] = appData.gymBranches;
        break;
      case "branchVisits":
        payload.datasets[dataset] = appData.branchVisits;
        break;
      case "leads":
        payload.datasets[dataset] = businessStore.leads;
        break;
      case "dietPlans":
        payload.datasets[dataset] = businessStore.dietPlans;
        break;
      default:
        break;
    }
  });

  return Response.json(payload);
}
