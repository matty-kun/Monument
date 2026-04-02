"use server";

import { createServiceClient } from "@/utils/supabase/server";

export async function uploadImageAction(formData: FormData, bucket: string, pathPrefix: string) {
  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  const supabase = createServiceClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36)}.${fileExt}`;
  const filePath = `${pathPrefix}/${fileName}`;

  // Convert File to ArrayBuffer for Supabase Storage
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true
    });

  if (uploadError) {
    console.error(`Admin Upload Error [Bucket: ${bucket}, Path: ${filePath}]:`, uploadError);
    return { success: false, error: `${uploadError.message} (Bucket: ${bucket})` };
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return { success: true, publicUrl: data.publicUrl };
}

export async function deleteImageAction(bucket: string, filePath: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(bucket).remove([filePath]);

  if (error) {
    console.error(`Admin Delete Error [${bucket}]:`, error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
