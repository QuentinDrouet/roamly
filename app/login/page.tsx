'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authSchema, AuthInput } from "@/schemas/authSchema"
import { loginWithEmail } from "@/services/authService"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AuthInput>({
    resolver: zodResolver(authSchema),
  })

  const onSubmit = async (data: AuthInput) => {
    try {
      await loginWithEmail(data.email, data.password)
      router.push("/")
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm w-full">
        <Input placeholder="Email" {...register("email")} />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}

        <Input placeholder="Password" type="password" {...register("password")} />
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}

        <Button type="submit" className="w-full">Se connecter</Button>
        {error && <p className="text-sm text-red-500">{error}</p>}

        <p className="text-sm text-center">
          Pas encore de compte ? <span className="text-blue-600 cursor-pointer" onClick={() => router.push("/register")}>Créer un compte</span>
        </p>
      </form>
    </div>
  )
}
