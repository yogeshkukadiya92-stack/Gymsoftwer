import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { getFormBySlug } from "@/lib/forms-store";
import { uploadPublicFormFileToSupabaseStorage } from "@/lib/supabase/storage";

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const form = await getFormBySlug(slug);

  if (!form) {
    return Response.json({ error: "Form not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const fieldId = String(formData.get("fieldId") ?? "").trim();
  const file = formData.get("file");

  if (!fieldId) {
    return Response.json({ error: "Field id is required." }, { status: 400 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "File is required." }, { status: 400 });
  }

  let fileUrl = await uploadPublicFormFileToSupabaseStorage(file);

  if (!fileUrl) {
    const uploadsDirectory = path.join(process.cwd(), "public", "uploads", "forms");
    await mkdir(uploadsDirectory, { recursive: true });

    const extension = path.extname(file.name) || ".bin";
    const baseName = sanitizeFileName(path.basename(file.name, extension));
    const nextFileName = `${Date.now()}-${baseName}${extension}`;
    const nextFilePath = path.join(uploadsDirectory, nextFileName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(nextFilePath, buffer);
    fileUrl = `/uploads/forms/${nextFileName}`;
  }

  return Response.json({
    message: "File uploaded successfully.",
    fieldId,
    fileName: file.name,
    fileUrl,
  });
}
