"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Force a full reload to clear SSR session and cookies
    window.location.href = "/auth/login";
  };

  return (
    <Button onClick={logout} variant="outline">
      Logout
    </Button>
  );
}
