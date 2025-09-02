import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export const useCurrentUserImage = () => {
  const [image, setImage] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const fetchUserImage = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error fetching session:', error)
        return
      }
      
      // Try avatar_url first, then picture as fallback
      const avatarUrl = data.session?.user.user_metadata.avatar_url ?? 
                       data.session?.user.user_metadata.picture ?? null
      setImage(avatarUrl)
    }

    fetchUserImage()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const avatarUrl = session?.user.user_metadata.avatar_url ?? 
                       session?.user.user_metadata.picture ?? null
      setImage(avatarUrl)
    })

    return () => subscription.unsubscribe()
  }, [])

  return image
}
