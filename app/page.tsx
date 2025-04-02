import { createClient } from "@/utils/supabase/server"
import OpenAISearch from "@/components/common/OpenAISearch"
import AuthActions from "@/components/common/AuthActions"

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="self-start justify-self-end">
        <AuthActions user={user} />
      </div>
      <OpenAISearch />
    </div>
  )
}
