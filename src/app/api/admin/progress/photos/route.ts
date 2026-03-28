import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { addProgressPhoto } from "@/lib/app-data-store";
import { uploadProgressPhotoToSupabaseStorage } from "@/lib/supabase/storage";

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const memberId = String(formData.get("memberId") ?? "").trim();
  const recordedOn = String(formData.get("recordedOn") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const file = formData.get("file");

  if (!memberId || !recordedOn || !label) {
    return Response.json(
      { error: "Member, date, and label are required." },
      { status: 400 },
    );
  }

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Image file is required." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "Only image uploads are allowed." }, { status: 400 });
  }

  let imageUrl = await uploadProgressPhotoToSupabaseStorage(file);

  if (!imageUrl) {
    const uploadsDirectory = path.join(process.cwd(), "public", "uploads", "progress");
    await mkdir(uploadsDirectory, { recursive: true });

    const extension = path.extname(file.name) || ".jpg";
    const baseName = sanitizeFileName(path.basename(file.name, extension));
    const nextFileName = `${Date.now()}-${baseName}${extension}`;
    const nextFilePath = path.join(uploadsDirectory, nextFileName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(nextFilePath, buffer);
    imageUrl = `/uploads/progress/${nextFileName}`;
  }

  const photo = await addProgressPhoto({
    memberId,
    recordedOn,
    label,
    note,
    imageUrl,
  });

  return Response.json({
    message: "Progress photo uploaded successfully.",
    photo,
  });
}
