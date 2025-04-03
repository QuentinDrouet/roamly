'use client'

import { logout } from "@/services/authService"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function AuthActions({ user }: { user: any }) {
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.refresh()
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleLogout}>Se déconnecter</Button>
      </div>
    )
  }

  return <Button onClick={() => router.push("/login")}>Se connecter</Button>
}
