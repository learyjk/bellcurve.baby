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

  const supabase = await createClient();

  // Get user_id from Supabase session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user || !user.id) {
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

  const poolData: TablesInsert<"pools"> = {
    baby_name,
    due_date,
    slug,
    user_id,
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
