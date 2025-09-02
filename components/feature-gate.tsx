"use client";

import { useEffect, useState } from "react";
import { FeatureFlag } from "@/lib/features/types";
import { createClient } from "@/lib/supabase/client";

interface FeatureGateProps {
  feature: FeatureFlag;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient();
      
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_features")
        .select("id")
        .eq("user_id", user.id)
        .eq("feature", feature)
        .single();

      setHasAccess(!!data && !error);
      setLoading(false);
    }

    checkAccess();
  }, [feature]);

  if (loading) {
    return null; // Or a loading spinner
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
