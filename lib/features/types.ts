import { Tables } from "@/database.types";

// Feature flag definitions
export const FEATURES = {
  CREATE_BABY_POOL: "create_baby_pool",
  // Add more features here as needed
  // ADVANCED_ANALYTICS: 'advanced_analytics',
  // CUSTOM_THEMES: 'custom_themes',
} as const;

export type FeatureFlag = (typeof FEATURES)[keyof typeof FEATURES];

// Use the database type instead of defining our own
export type UserFeature = Tables<"user_features">;
