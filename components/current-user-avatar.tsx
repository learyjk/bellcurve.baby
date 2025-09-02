"use client";

import { useCurrentUserImage } from "@/hooks/use-current-user-image";
import { useCurrentUserName } from "@/hooks/use-current-user-name";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";

interface CurrentUserAvatarProps {
  user?: User | null;
}

export const CurrentUserAvatar = ({
  user: userProp,
}: CurrentUserAvatarProps = {}) => {
  // Use hooks as fallback if no user prop is provided
  const hookProfileImage = useCurrentUserImage();
  const hookName = useCurrentUserName();

  // Extract data from user prop or fall back to hooks
  const profileImage =
    userProp?.user_metadata?.avatar_url ||
    userProp?.user_metadata?.picture ||
    hookProfileImage;
  const name = userProp?.user_metadata?.full_name || hookName;

  const [imageError, setImageError] = useState(false);

  const initials =
    name && name !== "?"
      ? name
          .split(" ")
          .map((word: string) => word[0])
          .join("")
          .toUpperCase()
      : "?";

  // Reset error state when image URL changes
  useEffect(() => {
    if (profileImage) {
      setImageError(false);
    }
  }, [profileImage]);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Avatar className="size-8">
      {profileImage && !imageError && (
        <AvatarImage
          src={profileImage}
          alt={initials || "User"}
          onError={handleImageError}
          className="object-cover"
          referrerPolicy="no-referrer"
        />
      )}
      <AvatarFallback className="text-xs font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};
