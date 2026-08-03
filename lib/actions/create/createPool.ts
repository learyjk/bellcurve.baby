"use server";
import { TablesInsert } from "@/database.types";
import { pricingModelSigmas, PricingModel } from "@/lib/helpers/pricingModels";
import { getVideoEmbed } from "@/lib/helpers/videoEmbed";
import { createClient } from "@/lib/supabase/server";
import { MAX_PRICE_CEILING, MIN_PRICE_FLOOR } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export type CreatePoolState = {
  /** Form-level message, shown in the error summary and as a toast. */
  message: string | null;
  /** Per-field errors, rendered inline under each field. */
  errors?: Record<string, string[]>;
};

export async function createPool(
  prevState: CreatePoolState,
  formData: FormData
): Promise<CreatePoolState> {
  const baby_name = (formData.get("baby_name") as string | null)?.trim();
  const organized_by = (formData.get("organized_by") as string | null)?.trim();
  const due_date = formData.get("due_date") as string;
  const slug = formData.get("slug") as string;
  const price_floor = parseFloat(formData.get("price_floor") as string);
  const price_ceiling = parseFloat(formData.get("price_ceiling") as string);
  const pricingModel = formData.get("pricingModel") as PricingModel | undefined;
  // Get expected weight in ounces
  const mu_weight_ounces = parseInt(
    formData.get("mu_weight_ounces") as string,
    10
  );
  const description = (formData.get("description") as string | null)?.trim();
  const video_url_raw = (formData.get("video_url") as string | null)?.trim();
  const imageFile = formData.get("image") as File | null;
  const organizerImageFile = formData.get("organizer_image") as File | null;

  const supabase = await createClient();

  // Auth check comes first — an unauthenticated request should fail before
  // we do any work (like uploading images to storage).
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user || !user.id || userError) {
    console.error("User not authenticated or error fetching user:", userError);
    return {
      message: "You must be logged in to create a pool.",
      errors: {},
    };
  }
  const user_id = user.id;

  // --- Validation ---
  // Collect per-field errors so the client can render them inline next to
  // each field (the same slots the client-side validation uses).
  const errors: Record<string, string[]> = {};

  if (!baby_name) errors.baby_name = ["Enter the baby's name."];
  if (!organized_by)
    errors.organized_by = ["Enter who is organizing this pool."];
  if (!due_date) errors.due_date = ["Select the expected due date."];
  if (!slug) errors.slug = ["Enter a pool slug."];
  if (!description)
    errors.description = ["Write a short description of the pool."];
  else if (description.length > 1000)
    errors.description = ["Description must be 1000 characters or fewer."];

  if (!Number.isFinite(price_floor))
    errors.price_floor = ["Enter a minimum guess price."];
  if (!Number.isFinite(price_ceiling))
    errors.price_ceiling = ["Enter a maximum guess price."];
  if (
    Number.isFinite(price_floor) &&
    Number.isFinite(price_ceiling) &&
    price_floor >= price_ceiling
  )
    errors.price_ceiling = ["Maximum price must be greater than minimum price."];
  if (
    (Number.isFinite(price_floor) && price_floor < MIN_PRICE_FLOOR) ||
    (Number.isFinite(price_ceiling) &&
      (price_ceiling > MAX_PRICE_CEILING || price_ceiling < 1))
  )
    errors.price_ceiling = [
      `Guess prices must be between $${MIN_PRICE_FLOOR} and $${MAX_PRICE_CEILING}.`,
    ];

  // Optional external video — validated server-side; we only persist URLs we
  // can convert into a YouTube/Vimeo embed, never arbitrary iframe sources.
  let video_url: string | null = null;
  if (video_url_raw) {
    if (getVideoEmbed(video_url_raw)) {
      video_url = video_url_raw;
    } else {
      errors.video_url = [
        "Unrecognized video link. Paste a YouTube or Vimeo URL (e.g. https://www.youtube.com/watch?v=...), or leave the field blank.",
      ];
    }
  }

  const maxImageSize = 400 * 1024; // 400kB in bytes
  if (imageFile && imageFile.size > maxImageSize)
    errors.image = [
      "Image file size must be under 400kB. Please choose a smaller image or compress it.",
    ];
  if (organizerImageFile && organizerImageFile.size > maxImageSize)
    errors.organizer_image = [
      "Organizer image file size must be under 400kB. Please choose a smaller image or compress it.",
    ];

  if (Object.keys(errors).length > 0) {
    return {
      message: "Please fix the fields highlighted below.",
      errors,
    };
  }

  let image_url: string | null = null;
  if (imageFile && imageFile.size > 0) {
    // Upload image to Supabase Storage
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${slug}-${uuidv4()}.${fileExt}`;
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
        errors: { image: ["Image upload failed. Please try another image."] },
      };
    }
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("pool-images")
      .getPublicUrl(fileName);
    image_url = publicUrlData?.publicUrl || null;
  }

  let organizer_image_url: string | null = null;
  if (organizerImageFile && organizerImageFile.size > 0) {
    // Upload organizer image to Supabase Storage
    const fileExt = organizerImageFile.name.split(".").pop();
    const fileName = `${slug}-organizer-${uuidv4()}.${fileExt}`;
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
        errors: {
          organizer_image: [
            "Organizer image upload failed. Please try another image.",
          ],
        },
      };
    }
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("pool-images")
      .getPublicUrl(fileName);
    organizer_image_url = publicUrlData?.publicUrl || null;
  }

  // Set sigma values based on pricingModel
  const { dateSigma: sigma_days, weightSigma: sigma_weight } =
    pricingModelSigmas[pricingModel ?? "standard"];

  // Reuse an existing Stripe Connect account if this user has already
  // completed onboarding on any of their other pools — a connected account
  // represents the person (bank + identity), not the individual pool, so
  // there is no reason to make them onboard again per pool.
  const { data: previousConnection } = await supabase
    .from("pools")
    .select("stripe_account_id")
    .eq("user_id", user_id)
    .eq("stripe_onboarding_complete", true)
    .not("stripe_account_id", "is", null)
    .limit(1)
    .maybeSingle();

  const poolData: TablesInsert<"pools"> = {
    baby_name,
    organized_by,
    mu_due_date: due_date,
    slug,
    user_id,
    price_floor,
    price_ceiling,
    sigma_days,
    mu_weight: mu_weight_ounces, // store as ounces
    sigma_weight,
    description: description || null,
    video_url,
    image_url,
    organizer_image_url,
    ...(previousConnection?.stripe_account_id
      ? {
          stripe_account_id: previousConnection.stripe_account_id,
          stripe_onboarding_complete: true,
        }
      : {}),
  };
  const { data: newPool, error } = await supabase
    .from("pools")
    .insert(poolData)
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation. The slug is re-checked by the client just
    // before submit, so hitting this means someone else claimed it in the
    // meantime — report it on the slug field rather than as a raw DB error.
    if (error.code === "23505") {
      return {
        message: "That pool URL was just taken. Please choose another.",
        errors: { slug: ["This slug was just taken. Please choose another."] },
      };
    }
    return {
      message: error.message,
      errors: {},
    };
  }

  if (newPool) {
    revalidatePath(`/baby/${newPool.slug}`);
    // Skip the Stripe onboarding step entirely if we inherited a working
    // connection from one of the user's other pools.
    if (newPool.stripe_onboarding_complete && newPool.stripe_account_id) {
      redirect(`/baby/${newPool.slug}`);
    }
    redirect(`/baby/${newPool.slug}/connect`);
  }

  return {
    message: null,
    errors: {},
  };
}
