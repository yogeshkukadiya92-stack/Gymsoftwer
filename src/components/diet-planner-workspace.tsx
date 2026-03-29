"use client";

import { useMemo, useState } from "react";

import { DietPlanRecord } from "@/lib/business-data";

type DietPlannerWorkspaceProps = {
  plans: DietPlanRecord[];
};

export function DietPlannerWorkspace({ plans }: DietPlannerWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id ?? "");

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

  return (
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
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelectedPlanId(plan.id)}
            className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
              selectedPlan?.id === plan.id
                ? "border-orange-300 bg-orange-50"
                : "border-slate-200 bg-white hover:border-orange-200"
            }`}
          >
            <p className="font-semibold text-slate-950">{plan.memberName}</p>
            <p className="mt-1 text-sm text-slate-600">{plan.goal}</p>
            <p className="mt-2 text-sm text-slate-500">
              {plan.calories} kcal • {plan.proteinGrams}g protein • {plan.adherence}% adherence
            </p>
          </button>
        ))}
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
        {selectedPlan ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
              Diet overview
            </p>
            <h2 className="mt-2 font-serif text-3xl text-slate-950">{selectedPlan.memberName}</h2>
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
          </>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            No diet plans match this search.
          </div>
        )}
      </div>
    </div>
  );
}
