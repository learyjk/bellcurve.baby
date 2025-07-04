"use client";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Add global type for window.google and CredentialResponse
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any;
  }
}
type CredentialResponse = {
  credential: string;
  select_by: string;
  clientId: string;
};

const OneTapGoogle = () => {
  const supabase = createClient();
  const router = useRouter();

  // generate nonce to use for google id token sign-in
  const generateNonce = async (): Promise<[string, string]> => {
    const nonce = btoa(
      String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
    );
    const encoder = new TextEncoder();
    const encodedNonce = encoder.encode(nonce);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedNonce = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return [nonce, hashedNonce];
  };

  useEffect(() => {
    const initializeGoogleOneTap = () => {
      window.addEventListener("load", async () => {
        const [nonce, hashedNonce] = await generateNonce();
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session", error);
        }
        if (data.session) {
          console.log("Already logged in, skipping One Tap");
          router.push("/");
          return;
        }
        if (
          !window.google ||
          !window.google.accounts ||
          !window.google.accounts.id
        ) {
          console.error("Google One Tap library not loaded");
          return;
        }
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: async (response: CredentialResponse) => {
            try {
              const { data, error } = await supabase.auth.signInWithIdToken({
                provider: "google",
                token: response.credential,
                nonce,
              });
              if (error) throw error;
              if (!data.session) {
                console.error("No session returned from Supabase");
                return;
              }
              window.location.reload();
            } catch (error) {
              console.error("Error logging in with Google One Tap", error);
            }
          },
          nonce: hashedNonce,
          use_fedcm_for_prompt: true,
        });
        window.google.accounts.id.prompt();
      });
    };
    initializeGoogleOneTap();
    return () => window.removeEventListener("load", initializeGoogleOneTap);
  }, [router, supabase.auth]);

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" />
      <div id="oneTap" className="fixed top-0 right-0 z-[100]" />
    </>
  );
};
export default OneTapGoogle;
