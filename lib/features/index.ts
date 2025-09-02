import { createClient } from "@/lib/supabase/server";
import { FeatureFlag } from "./types";

/**
 * Check if a user has access to a specific feature
 */
export async function hasFeatureAccess(
  userId: string,
  feature: FeatureFlag
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_features")
    .select("id")
    .eq("user_id", userId)
    .eq("feature", feature)
    .single();

  if (error) {
    // If no record found, user doesn't have access
    return false;
  }

  return !!data;
}

/**
 * Get all features a user has access to
 */
export async function getUserFeatures(userId: string): Promise<FeatureFlag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_features")
    .select("feature")
    .eq("user_id", userId);

  if (error || !data) {
    return [];
  }

  return data.map((row) => row.feature as FeatureFlag);
}

/**
 * Grant a feature to a user (admin function)
 */
export async function grantFeature(
  userId: string,
  feature: FeatureFlag,
  grantedBy?: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from("user_features").insert({
    user_id: userId,
    feature,
    granted_by: grantedBy,
  });

  return !error;
}

/**
 * Revoke a feature from a user (admin function)
 */
export async function revokeFeature(
  userId: string,
  feature: FeatureFlag
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("user_features")
    .delete()
    .eq("user_id", userId)
    .eq("feature", feature);

  return !error;
}
