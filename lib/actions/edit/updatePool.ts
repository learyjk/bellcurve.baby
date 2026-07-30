"use server";
import { TablesUpdate } from "@/database.types";
import { getVideoEmbed } from "@/lib/helpers/videoEmbed";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

export type UpdatePoolState = {
  message: string | null;
  success?: boolean;
  errors?: Record<string, string[]>;
};

const MAX_IMAGE_SIZE = 400 * 1024; // 400kB, matches createPool

/** YYYY-MM-DD, tolerating no leading zeros (e.g. 2026-8-1). */
const DATE_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

export async function updatePool(
  prevState: UpdatePoolState,
  formData: FormData
): Promise<UpdatePoolState> {
  const supabase = await createClient();

  const pool_id = formData.get("pool_id") as string | null;
  const baby_name = formData.get("baby_name") as string | null;
  const organized_by = formData.get("organized_by") as string | null;
  const due_date = formData.get("due_date") as string | null;
  const description = formData.get("description") as string | null;
  const video_url_raw = (formData.get("video_url") as string | null)?.trim();
  const mu_weight_ounces_raw = formData.get("mu_weight_ounces") as
    | string
    | null;
  const imageFile = formData.get("image") as File | null;
  const organizerImageFile = formData.get("organizer_image") as File | null;
  const remove_image = formData.get("remove_image") === "1";
  const remove_organizer_image = formData.get("remove_organizer_image") === "1";

  if (!pool_id) {
    return { message: "Missing pool ID.", errors: {} };
  }

  // --- Auth: must be the logged-in owner ---
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user || userError) {
    return { message: "You must be logged in to edit a pool.", errors: {} };
  }

  const { data: pool } = await supabase
    .from("pools")
    .select("*")
    .eq("id", pool_id)
    .single();

  if (!pool || String(pool.user_id) !== String(user.id)) {
    return { message: "Pool not found or user not authorized.", errors: {} };
  }

  if (pool.is_locked) {
    return { message: "This pool is closed and can no longer be edited.", errors: {} };
  }

  // --- Validation ---
  if (!baby_name?.trim() || !organized_by?.trim() || !due_date?.trim()) {
    return {
      message: "Baby name, organized by, and due date are required.",
      errors: {},
    };
  }

  const dateMatch = DATE_RE.exec(due_date.trim());
  if (!dateMatch) {
    return {
      message: "Due date must be a valid date (YYYY-MM-DD).",
      errors: { due_date: ["Invalid date"] },
    };
  }
  const normalizedDueDate = `${dateMatch[1]}-${dateMatch[2].padStart(
    2,
    "0"
  )}-${dateMatch[3].padStart(2, "0")}`;

  const mu_weight_ounces = parseInt(mu_weight_ounces_raw ?? "", 10);
  if (
    isNaN(mu_weight_ounces) ||
    mu_weight_ounces < 0 ||
    mu_weight_ounces > 20 * 16
  ) {
    return {
      message: "Expected weight must be between 0 and 20 lbs.",
      errors: { mu_weight: ["Invalid weight"] },
    };
  }

  if ((description?.length ?? 0) > 1000) {
    return {
      message: "Description must be 1000 characters or fewer.",
      errors: { description: ["Too long"] },
    };
  }

  // Optional external video — same rules as creation: only persist URLs we
  // can convert into a YouTube/Vimeo embed. Blank clears the video.
  let video_url: string | null = null;
  if (video_url_raw) {
    if (getVideoEmbed(video_url_raw)) {
      video_url = video_url_raw;
    } else {
      return {
        message:
          "We couldn't recognize that video link. Please paste a YouTube or Vimeo URL (e.g. https://www.youtube.com/watch?v=...), or leave the field blank.",
        errors: { video_url: ["Unrecognized video URL"] },
      };
    }
  }

  // --- Optional image uploads ---
  let image_url = pool.image_url;
  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > MAX_IMAGE_SIZE) {
      return {
        message:
          "Image file size must be under 400kB. Please choose a smaller image or compress it.",
        errors: {},
      };
    }
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${pool.slug}-${uuidv4()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("pool-images")
      .upload(fileName, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type,
      });
    if (uploadError) {
      return {
        message: `Image upload failed: ${uploadError.message}`,
        errors: {},
      };
    }
    const { data: publicUrlData } = supabase.storage
      .from("pool-images")
      .getPublicUrl(fileName);
    image_url = publicUrlData?.publicUrl || null;
  } else if (remove_image) {
    image_url = null;
  }

  let organizer_image_url = pool.organizer_image_url;
  if (organizerImageFile && organizerImageFile.size > 0) {
    if (organizerImageFile.size > MAX_IMAGE_SIZE) {
      return {
        message:
          "Organizer image file size must be under 400kB. Please choose a smaller image or compress it.",
        errors: {},
      };
    }
    const fileExt = organizerImageFile.name.split(".").pop();
    const fileName = `${pool.slug}-organizer-${uuidv4()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("pool-images")
      .upload(fileName, organizerImageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: organizerImageFile.type,
      });
    if (uploadError) {
      return {
        message: `Organizer image upload failed: ${uploadError.message}`,
        errors: {},
      };
    }
    const { data: publicUrlData } = supabase.storage
      .from("pool-images")
      .getPublicUrl(fileName);
    organizer_image_url = publicUrlData?.publicUrl || null;
  } else if (remove_organizer_image) {
    organizer_image_url = null;
  }

  // --- Update ---
  const poolUpdate: TablesUpdate<"pools"> = {
    baby_name: baby_name.trim(),
    organized_by: organized_by.trim(),
    mu_due_date: normalizedDueDate,
    description: description || null,
    video_url,
    mu_weight: mu_weight_ounces, // stored as ounces
    image_url,
    organizer_image_url,
  };

  const { error } = await supabase
    .from("pools")
    .update(poolUpdate)
    .eq("id", pool_id);

  if (error) {
    return { message: `Failed to update pool: ${error.message}`, errors: {} };
  }

  revalidatePath(`/baby/${pool.slug}`);
  return { message: "Pool updated!", success: true, errors: {} };
}
