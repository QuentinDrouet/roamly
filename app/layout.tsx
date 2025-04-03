import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roamly",
  description: "Your travel companion",
};

// app/layout.tsx
import { createClient } from "@/utils/supabase/server"
import Navigation from "@/components/common/Navigation"
import { Inter } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@/contexts/UserContext';

const inter = Inter({ subsets: ['latin'] })

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const supabase = await createClient()

  return (
    <html lang="en">
      <body className={inter.className}>
      <UserProvider>
        <div className="flex flex-col min-h-screen">
          <Navigation />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </UserProvider>
      </body>
    </html>
  )
}
