'use client'

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/UserContext"

export default function AuthActions() {
  const router = useRouter()
  const { user, signOut } = useUser()

  const handleLogout = async () => {
    await signOut()
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2"> 
      {user ? (
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleLogout}>Se déconnecter</Button>
        </div>
      ) : (
        <Button onClick={() => router.push("/login")}>Se connecter</Button>
      )}
    </div>
  )
}