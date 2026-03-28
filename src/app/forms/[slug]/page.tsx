import { notFound } from "next/navigation";

import { PublicIntakeForm } from "@/components/public-intake-form";
import { getFormBySlug } from "@/lib/forms-store";

export const dynamic = "force-dynamic";

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const form = await getFormBySlug(slug);

  if (!form) {
    notFound();
  }

  return <PublicIntakeForm form={form} />;
}
