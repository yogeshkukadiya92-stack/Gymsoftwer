"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DietPlanRecord } from "@/lib/business-data";
import { Profile } from "@/lib/types";

type DietPlannerWorkspaceProps = {
  plans: DietPlanRecord[];
  members: Profile[];
  prefillMemberId?: string;
};

const baseEmptyForm = {
  id: "",
  memberId: "",
  memberName: "",
  coach: "",
  goal: "",
  calories: "0",
  proteinGrams: "0",
  adherence: "0",
  updatedOn: new Date().toISOString().slice(0, 10),
  mealTitles: ["Breakfast", "Lunch", "Snack", "Dinner"],
  mealItems: ["", "", "", ""],
};

function createEmptyForm(prefillMember?: Profile | null) {
  return {
    ...baseEmptyForm,
    memberId: prefillMember?.id ?? "",
    memberName: prefillMember?.fullName ?? "",
  };
}

export function DietPlannerWorkspace({
  plans: initialPlans,
  members,
  prefillMemberId = "",
}: DietPlannerWorkspaceProps) {
  const prefillMember = members.find((member) => member.id === prefillMemberId) ?? null;
  const [plans, setPlans] = useState(initialPlans);
  const [query, setQuery] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlans[0]?.id ?? "");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [formState, setFormState] = useState(() => createEmptyForm(prefillMember));

  const filteredPlans = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return plans;
    }

    return plans.filter((plan) =>
      [plan.memberName, plan.goal, plan.coach, ...plan.meals.flatMap((meal) => meal.items)]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [plans, query]);

  const selectedPlan =
    filteredPlans.find((plan) => plan.id === selectedPlanId) ?? filteredPlans[0] ?? null;
  const selectedPlanMember = selectedPlan?.memberId
    ? members.find((member) => member.id === selectedPlan.memberId)
    : members.find((member) => member.fullName === selectedPlan?.memberName);

  const whatsappShareUrl = useMemo(() => {
    const phone = selectedPlanMember?.phone?.replace(/[^\d]/g, "") ?? "";

    if (!selectedPlan || !phone) {
      return "";
    }

    const message = [
      `Diet plan for ${selectedPlan.memberName}`,
      `Goal: ${selectedPlan.goal}`,
      `Calories: ${selectedPlan.calories}`,
      `Protein: ${selectedPlan.proteinGrams}g`,
      "",
      ...selectedPlan.meals.map((meal) => `${meal.title}: ${meal.items.join(", ")}`),
    ].join("\n");

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }, [selectedPlan, selectedPlanMember]);

  function resetForm() {
    setFormState(createEmptyForm(prefillMember));
  }

  function populateForm(plan: DietPlanRecord) {
    setFormState({
      id: plan.id,
      memberId: plan.memberId ?? "",
      memberName: plan.memberName,
      coach: plan.coach,
      goal: plan.goal,
      calories: String(plan.calories),
      proteinGrams: String(plan.proteinGrams),
      adherence: String(plan.adherence),
      updatedOn: plan.updatedOn,
      mealTitles: [
        plan.meals[0]?.title ?? "Breakfast",
        plan.meals[1]?.title ?? "Lunch",
        plan.meals[2]?.title ?? "Snack",
        plan.meals[3]?.title ?? "Dinner",
      ],
      mealItems: [
        (plan.meals[0]?.items ?? []).join(", "),
        (plan.meals[1]?.items ?? []).join(", "),
        (plan.meals[2]?.items ?? []).join(", "),
        (plan.meals[3]?.items ?? []).join(", "),
      ],
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("");
    setIsSubmitting(true);

    const meals = formState.mealTitles.map((title, index) => ({
      title,
      items: formState.mealItems[index]
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    }));

    const response = await fetch("/api/admin/diet-planner", {
      method: formState.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: formState.id,
        memberId: formState.memberId,
        memberName: formState.memberName,
        coach: formState.coach,
        goal: formState.goal,
        calories: Number(formState.calories),
        proteinGrams: Number(formState.proteinGrams),
        adherence: Number(formState.adherence),
        updatedOn: formState.updatedOn,
        meals,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      plan?: DietPlanRecord;
    };

    if (!response.ok || !payload.plan) {
      setStatusMessage(payload.error ?? "Diet plan save failed.");
      setIsSubmitting(false);
      return;
    }

    setPlans((current) =>
      formState.id
        ? current.map((plan) => (plan.id === payload.plan?.id ? payload.plan : plan))
        : [payload.plan!, ...current],
    );
    setSelectedPlanId(payload.plan.id);
    setStatusMessage(
      payload.message ?? (formState.id ? "Diet plan updated." : "Diet plan created."),
    );
    resetForm();
    setIsSubmitting(false);
  }

  async function handleDelete(id: string) {
    setIsDeleting(id);
    setStatusMessage("");

    const response = await fetch("/api/admin/diet-planner", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const payload = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setStatusMessage(payload.error ?? "Diet plan delete failed.");
      setIsDeleting(null);
      return;
    }

    setPlans((current) => current.filter((plan) => plan.id !== id));
    if (selectedPlanId === id) {
      setSelectedPlanId("");
    }
    if (formState.id === id) {
      resetForm();
    }
    setStatusMessage(payload.message ?? "Diet plan deleted.");
    setIsDeleting(null);
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-serif text-2xl text-slate-950">
            {formState.id ? "Edit diet plan" : "Create diet plan"}
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
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm lg:col-span-2"
            value={formState.memberId}
            onChange={(event) => {
              const member = members.find((item) => item.id === event.target.value);

              setFormState((current) => ({
                ...current,
                memberId: event.target.value,
                memberName: member?.fullName ?? current.memberName,
              }));
            }}
          >
            <option value="">Select member</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName} {member.phone ? `- ${member.phone}` : ""}
              </option>
            ))}
          </select>
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Member name"
            value={formState.memberName}
            onChange={(event) =>
              setFormState((current) => ({ ...current, memberName: event.target.value }))
            }
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Coach"
            value={formState.coach}
            onChange={(event) =>
              setFormState((current) => ({ ...current, coach: event.target.value }))
            }
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm lg:col-span-2"
            placeholder="Goal"
            value={formState.goal}
            onChange={(event) =>
              setFormState((current) => ({ ...current, goal: event.target.value }))
            }
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Calories"
            type="number"
            value={formState.calories}
            onChange={(event) =>
              setFormState((current) => ({ ...current, calories: event.target.value }))
            }
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Protein grams"
            type="number"
            value={formState.proteinGrams}
            onChange={(event) =>
              setFormState((current) => ({ ...current, proteinGrams: event.target.value }))
            }
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Adherence"
            type="number"
            value={formState.adherence}
            onChange={(event) =>
              setFormState((current) => ({ ...current, adherence: event.target.value }))
            }
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            type="date"
            value={formState.updatedOn}
            onChange={(event) =>
              setFormState((current) => ({ ...current, updatedOn: event.target.value }))
            }
          />
          {formState.mealTitles.map((title, index) => (
            <div key={`${title}-${index}`} className="rounded-[1.25rem] bg-slate-50 p-4 lg:col-span-2">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                placeholder="Meal title"
                value={formState.mealTitles[index]}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    mealTitles: current.mealTitles.map((item, itemIndex) =>
                      itemIndex === index ? event.target.value : item,
                    ),
                  }))
                }
              />
              <textarea
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                rows={2}
                placeholder="Meal items separated by comma"
                value={formState.mealItems[index]}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    mealItems: current.mealItems.map((item, itemIndex) =>
                      itemIndex === index ? event.target.value : item,
                    ),
                  }))
                }
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{statusMessage}</p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white"
          >
            {isSubmitting ? "Saving..." : formState.id ? "Save plan" : "Create plan"}
          </button>
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search member, goal, coach..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          />
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-[1.5rem] border p-4 transition ${
                selectedPlan?.id === plan.id
                  ? "border-orange-300 bg-orange-50"
                  : "border-slate-200 bg-white hover:border-orange-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className="w-full text-left"
              >
                <p className="font-semibold text-slate-950">{plan.memberName}</p>
                <p className="mt-1 text-sm text-slate-600">{plan.goal}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {plan.calories} kcal • {plan.proteinGrams}g protein • {plan.adherence}% adherence
                </p>
              </button>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => populateForm(plan)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(plan.id)}
                  disabled={isDeleting === plan.id}
                  className="rounded-full bg-rose-600 px-3 py-2 text-sm text-white disabled:opacity-60"
                >
                  {isDeleting === plan.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          {selectedPlan ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
                Diet overview
              </p>
              <h2 className="mt-2 font-serif text-3xl text-slate-950">
                {selectedPlan.memberName}
              </h2>
              <p className="mt-2 text-slate-600">
                {selectedPlan.goal} • Coach: {selectedPlan.coach}
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.5rem] bg-slate-950 p-4 text-white">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Calories</p>
                  <p className="mt-3 text-3xl font-semibold">{selectedPlan.calories}</p>
                </div>
                <div className="rounded-[1.5rem] bg-orange-50 p-4 text-orange-900">
                  <p className="text-sm uppercase tracking-[0.24em] text-orange-700">Protein</p>
                  <p className="mt-3 text-3xl font-semibold">{selectedPlan.proteinGrams}g</p>
                </div>
                <div className="rounded-[1.5rem] bg-emerald-50 p-4 text-emerald-900">
                  <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Adherence</p>
                  <p className="mt-3 text-3xl font-semibold">{selectedPlan.adherence}%</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {selectedPlan.meals.map((meal) => (
                  <div key={meal.title} className="rounded-[1.5rem] border border-slate-200 p-4">
                    <p className="font-semibold text-slate-950">{meal.title}</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {meal.items.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {selectedPlanMember ? (
                  <Link
                    href={`/admin/users?userId=${selectedPlanMember.id}`}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    Open user
                  </Link>
                ) : null}
                {whatsappShareUrl ? (
                  <a
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Share on WhatsApp
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400"
                  >
                    No WhatsApp number
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Print plan
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              No diet plans match this search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
