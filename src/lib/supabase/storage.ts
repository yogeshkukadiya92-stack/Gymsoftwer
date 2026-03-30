import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const defaultBucket = "progress-photos";

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function uploadProgressPhotoToSupabaseStorage(file: File) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || defaultBucket;
  const fileExtension = file.name.split(".").pop() || "jpg";
  const baseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ""));
  const filePath = `progress/${Date.now()}-${baseName}.${fileExtension}`;

  const { data: bucketData } = await supabase.storage.getBucket(bucket).catch(() => ({
    data: null,
  }));

  if (!bucketData) {
    await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
    });
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return data.publicUrl;
}

export async function uploadPublicFormFileToSupabaseStorage(file: File) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const bucket = process.env.NEXT_PUBLIC_SUPABASE_FORMS_BUCKET || "form-uploads";
  const fileExtension = file.name.split(".").pop() || "bin";
  const baseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ""));
  const filePath = `forms/${Date.now()}-${baseName}.${fileExtension}`;

  const { data: bucketData } = await supabase.storage.getBucket(bucket).catch(() => ({
    data: null,
  }));

  if (!bucketData) {
    await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 15 * 1024 * 1024,
    });
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return data.publicUrl;
}
