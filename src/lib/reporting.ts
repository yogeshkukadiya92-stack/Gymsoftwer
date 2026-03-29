import { getDietPlans, getLeadRecords } from "@/lib/business-data-store";
import { getAppData } from "@/lib/data";
import { getAllForms, getAllFormResponses } from "@/lib/forms-store";

export function formatInr(value: number) {
  return `INR ${value}`;
}

export function getMemberGrowthRows(joinDates: string[]) {
  const counts = new Map<string, number>();

  joinDates.forEach((date) => {
    const monthKey = date.slice(0, 7);
    counts.set(monthKey, (counts.get(monthKey) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

export async function getReportsSnapshot() {
  const [data, forms, responses, dietPlans, leads] = await Promise.all([
    getAppData(),
    getAllForms(),
    getAllFormResponses(),
    getDietPlans(),
    getLeadRecords(),
  ]);

  const members = data.profiles.filter((profile) => profile.role === "member");
  const memberGrowth = getMemberGrowthRows(members.map((member) => member.joinedOn));
  const maxGrowthCount = Math.max(...memberGrowth.map((item) => item.count), 1);

  const presentCount = data.attendance.filter((entry) => entry.status === "Checked In").length;
  const absentCount = data.attendance.filter((entry) => entry.status === "Missed").length;
  const bookedCount = data.attendance.filter((entry) => entry.status === "Booked").length;

  const collectedRevenue = data.invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + invoice.amountInr, 0);
  const outstandingRevenue = data.memberships.reduce(
    (sum, membership) => sum + membership.outstandingAmountInr,
    0,
  );
  const overdueInvoices = data.invoices.filter((invoice) => invoice.status === "Overdue").length;

  const estimatedInventoryMargin = data.inventorySales.reduce((sum, sale) => {
    const item = data.inventoryItems.find((inventoryItem) => inventoryItem.id === sale.itemId);
    if (!item) {
      return sum;
    }
    return sum + (sale.totalAmountInr - item.costPriceInr * sale.quantity);
  }, 0);

  const formSummary = forms.map((form) => ({
    id: form.id,
    title: form.title,
    responses: responses.filter((response) => response.formId === form.id).length,
  }));
  const topFormResponses = [...formSummary].sort((a, b) => b.responses - a.responses);

  const trainers = data.profiles.filter((profile) => profile.role === "trainer");
  const trainerRows = trainers.map((trainer) => ({
    id: trainer.id,
    fullName: trainer.fullName,
    activePlans: data.workoutPlans.filter((plan) => plan.coach === trainer.fullName).length,
    classes: data.sessions.filter((session) => session.coach === trainer.fullName).length,
  }));

  const leadStats = {
    total: leads.length,
    converted: leads.filter((lead) => lead.status === "Converted").length,
    activeTrials: leads.filter((lead) => lead.status === "Trial Booked").length,
    new: leads.filter((lead) => lead.status === "New").length,
  };

  const avgDietAdherence =
    dietPlans.length > 0
      ? dietPlans.reduce((sum, plan) => sum + plan.adherence, 0) / dietPlans.length
      : 0;

  return {
    data,
    forms,
    responses,
    dietPlans,
    leads,
    members,
    memberGrowth,
    maxGrowthCount,
    presentCount,
    absentCount,
    bookedCount,
    collectedRevenue,
    outstandingRevenue,
    overdueInvoices,
    estimatedInventoryMargin,
    formSummary,
    topFormResponses,
    trainerRows,
    leadStats,
    avgDietAdherence,
  };
}
