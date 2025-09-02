import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export const useCurrentUserName = () => {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const fetchProfileName = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error(error)
        return
      }

      setName(data.session?.user.user_metadata.full_name ?? '?')
    }

    fetchProfileName()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setName(session?.user.user_metadata.full_name ?? '?')
    })

    return () => subscription.unsubscribe()
  }, [])

  return name || '?'
}
