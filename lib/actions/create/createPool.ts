"use server";
import { TablesInsert } from "@/database.types";
import { pricingModelSigmas, PricingModel } from "@/lib/helpers/pricingModels";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export type CreatePoolState = {
  message: string | null;
  errors?: Record<string, string[]>;
};

export async function createPool(
  prevState: CreatePoolState,
  formData: FormData
): Promise<CreatePoolState> {
  const baby_name = formData.get("baby_name") as string;
  const organized_by = formData.get("organized_by") as string;
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
  const description = formData.get("description") as string | null;
  const imageFile = formData.get("image") as File | null;
  const organizerImageFile = formData.get("organizer_image") as File | null;
  const supabase = await createClient();

  let image_url: string | null = null;
  if (imageFile && imageFile.size > 0) {
    // Check file size (400kB limit)
    const maxSize = 400 * 1024; // 400kB in bytes
    if (imageFile.size > maxSize) {
      return {
        message:
          "Image file size must be under 400kB. Please choose a smaller image or compress it.",
        errors: {},
      };
    }

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
        errors: {},
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
    // Check file size (400kB limit)
    const maxSize = 400 * 1024; // 400kB in bytes
    if (organizerImageFile.size > maxSize) {
      return {
        message:
          "Organizer image file size must be under 400kB. Please choose a smaller image or compress it.",
        errors: {},
      };
    }

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
        errors: {},
      };
    }
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("pool-images")
      .getPublicUrl(fileName);
    organizer_image_url = publicUrlData?.publicUrl || null;
  }

  // Get user_id from Supabase session
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

  if (!baby_name || !organized_by || !due_date || !slug) {
    return {
      message: "All required fields must be filled.",
      errors: {},
    };
  }

  // Validate pricing (only if price_floor and price_ceiling are provided)
  // Remove requirement for sigma_days (pricing style)
  if (!price_floor || !price_ceiling) {
    return {
      message: "Price floor and price ceiling are required.",
      errors: {},
    };
  }

  if (price_floor >= price_ceiling) {
    return {
      message: "Maximum price must be greater than minimum price.",
      errors: {},
    };
  }

  if (price_floor < 0.01 || price_ceiling < 0.01) {
    return {
      message: "Prices must be at least $0.01.",
      errors: {},
    };
  }

  // Set sigma values based on pricingModel
  const { dateSigma: sigma_days, weightSigma: sigma_weight } =
    pricingModelSigmas[pricingModel ?? "standard"];

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
    image_url,
    organizer_image_url,
  };
  const { data: newPool, error } = await supabase
    .from("pools")
    .insert(poolData)
    .select()
    .single();

  if (error) {
    return {
      message: error.message,
      errors: {},
    };
  }

  if (newPool) {
    revalidatePath(`/baby/${newPool.slug}`);
    redirect(`/baby/${newPool.slug}`);
  }

  return {
    message: null,
    errors: {},
  };
}
