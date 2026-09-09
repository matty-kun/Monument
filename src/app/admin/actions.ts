"use server";

import crypto from "crypto";
import { createServiceClient } from "@/utils/supabase/server";
import { AuthorizationError, requireAdmin } from "@/utils/supabase/authorization";
import {
  getImageExtension,
  validateImageFile,
  validateStoragePath,
  validateStorageTarget,
} from "@/utils/storagePolicy";

function actionError(error: unknown) {
  if (error instanceof AuthorizationError) {
    return { success: false as const, error: error.message };
  }

  console.error("Admin storage action failed:", error);
  return { success: false as const, error: "Storage operation failed." };
}

export async function uploadImageAction(formData: FormData, bucket: string, pathPrefix: string) {
  try {
    await requireAdmin();

    const targetError = validateStorageTarget(bucket, pathPrefix);
    if (targetError) return { success: false, error: targetError };

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { success: false, error: "No file provided." };
    }

    const fileError = validateImageFile(file);
    if (fileError) return { success: false, error: fileError };

    const supabase = createServiceClient();
    const fileName = `${crypto.randomUUID()}.${getImageExtension(file.type)}`;
    const filePath = `${pathPrefix}/${fileName}`;
    const buffer = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error(`Admin upload failed [Bucket: ${bucket}, Path: ${filePath}]:`, uploadError);
      return { success: false, error: "Image upload failed." };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return { success: true, publicUrl: data.publicUrl };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteImageAction(bucket: string, filePath: string) {
  try {
    await requireAdmin();

    const pathError = validateStoragePath(bucket, filePath);
    if (pathError) return { success: false, error: pathError };

    const supabase = createServiceClient();
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error(`Admin delete failed [Bucket: ${bucket}, Path: ${filePath}]:`, error);
      return { success: false, error: "Image deletion failed." };
    }

    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}
