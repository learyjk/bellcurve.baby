"use server";
import { TablesInsert } from "@/database.types";
import { createClient } from "@/lib/supabase/server";

export type CreatePoolState = {
  message: string | null;
  errors?: Record<string, string[]>;
};

export async function createPool(
  prevState: CreatePoolState,
  formData: FormData
): Promise<CreatePoolState> {
  const baby_name = formData.get("baby_name") as string;
  const due_date = formData.get("due_date") as string;
  const slug = formData.get("slug") as string;
  const price_floor = parseFloat(formData.get("price_floor") as string);
  const price_ceiling = parseFloat(formData.get("price_ceiling") as string);
  const sigma_days = parseFloat(formData.get("sigma_days") as string);

  const supabase = await createClient();

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

  if (!baby_name || !due_date || !slug) {
    return {
      message: "All fields are required.",
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

  const poolData: TablesInsert<"pools"> = {
    baby_name,
    due_date,
    slug,
    user_id,
    price_floor,
    price_ceiling,
    sigma_days,
    // Set reasonable defaults for weight distribution
    mu_weight: 7.6, // Average baby weight in lbs
    sigma_weight: 0.75, // Standard deviation for weight
  };
  const { error } = await supabase.from("pools").insert(poolData);

  if (error) {
    return {
      message: error.message,
      errors: {},
    };
  }

  return {
    message: null,
    errors: {},
  };
}
