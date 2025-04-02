import { createClient } from "@/utils/supabase/server"
import AuthActions from "@/components/common/AuthActions"
import MapWrapper from "@/components/common/MapWrapper"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="w-screen h-screen overflow-hidden">
      <div className="self-start justify-self-end">
        <AuthActions user={user} />
      </div>
      <MapWrapper />
    </main>
  );
}
