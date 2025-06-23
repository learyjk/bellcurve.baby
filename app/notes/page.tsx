import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: notes } = await supabase.from('notes').select()

  return (
    <div>
      {notes?.map(note => (
        <div key={note.id} className="p-4 border-b">
          <h2 className="text-lg font-semibold">{note.title || 'Untitled'}</h2>
        </div>
      ))}
    </div>
  )
}