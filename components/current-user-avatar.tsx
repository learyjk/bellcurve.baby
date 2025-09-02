'use client'

import { useCurrentUserImage } from '@/hooks/use-current-user-image'
import { useCurrentUserName } from '@/hooks/use-current-user-name'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useState, useEffect } from 'react'

export const CurrentUserAvatar = () => {
  const profileImage = useCurrentUserImage()
  const name = useCurrentUserName()
  const [imageError, setImageError] = useState(false)
  
  const initials = name && name !== '?' 
    ? name.split(' ').map((word) => word[0]).join('').toUpperCase()
    : '?'

  // Reset error state when image URL changes
  useEffect(() => {
    if (profileImage) {
      setImageError(false)
    }
  }, [profileImage])

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <Avatar className="size-8">
      {profileImage && !imageError && (
        <AvatarImage 
          src={profileImage} 
          alt={initials || 'User'} 
          onError={handleImageError}
          className="object-cover"
          crossOrigin="anonymous"
        />
      )}
      <AvatarFallback className="text-xs font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
