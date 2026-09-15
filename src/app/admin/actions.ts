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
import {
  type TournamentTeamInput,
  buildTournamentTeamPayload,
  validateTournamentTeamInput,
} from "@/features/admin/departments/teamPolicy";

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

function teamActionError(error: unknown) {
  if (error instanceof AuthorizationError) {
    return { success: false as const, error: error.message };
  }

  console.error("Admin team action failed:", error);
  return { success: false as const, error: "The team could not be saved." };
}

export async function saveTournamentTeamAction(input: TournamentTeamInput) {
  try {
    await requireAdmin();
    const validationError = validateTournamentTeamInput(input);
    if (validationError) return { success: false as const, error: validationError };

    const supabase = createServiceClient();
    const payload = buildTournamentTeamPayload(input);

    if (input.teamId) {
      const { data, error } = await supabase
        .from("tournament_departments")
        .update(payload)
        .eq("id", input.teamId)
        .eq("tournament_id", input.tournamentId)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) return { success: false as const, error: "Team not found in this tournament." };
      return { success: true as const };
    }

    // The legacy departments table has no unique name constraint, so an upsert
    // with onConflict: "name" always fails. Reuse an exact match or create one.
    const { data: existingDepartment, error: lookupError } = await supabase
      .from("departments")
      .select("id")
      .eq("name", payload.name)
      .limit(1)
      .maybeSingle();
    if (lookupError) throw lookupError;

    let departmentId = existingDepartment?.id;
    if (!departmentId) {
      const { data: createdDepartment, error: createError } = await supabase
        .from("departments")
        .insert(payload)
        .select("id")
        .single();
      if (createError) throw createError;
      departmentId = createdDepartment.id;
    }

    const { error: linkError } = await supabase.from("tournament_departments").insert({
      ...payload,
      tournament_id: input.tournamentId,
      department_id: departmentId,
    });
    if (linkError?.code === "23505") {
      return { success: false as const, error: "This team is already in the tournament." };
    }
    if (linkError) throw linkError;

    return { success: true as const };
  } catch (error) {
    return teamActionError(error);
  }
}

export async function deleteTournamentTeamAction(teamId: string, tournamentId: string) {
  try {
    await requireAdmin();
    const validationError = validateTournamentTeamInput({
      teamId,
      tournamentId,
      name: "deleted-team",
      abbreviation: "",
      imageUrl: null,
    });
    if (validationError) return { success: false as const, error: validationError };

    const { data, error } = await createServiceClient()
      .from("tournament_departments")
      .delete()
      .eq("id", teamId)
      .eq("tournament_id", tournamentId)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return { success: false as const, error: "Team not found in this tournament." };
    return { success: true as const };
  } catch (error) {
    return teamActionError(error);
  }
}
