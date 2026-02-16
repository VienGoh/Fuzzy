"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import Nav from "@/components/forms/Nav" // Pastikan path sesuai dengan lokasi komponen Nav

export default function ProtectedLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  console.log("ProtectedLayout status:", { status, session: session?.user?.email })

  useEffect(() => {
    // Jika tidak ada session, redirect ke login
    if (status === "unauthenticated") {
      console.log("No session, redirecting to login")
      const callbackUrl = encodeURIComponent(pathname || '/dashboard')
      router.push(`/login?callbackUrl=${callbackUrl}`)
    }
  }, [status, router, pathname])

  // Tampilkan loading saat checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Jika sudah authenticated, tampilkan konten
  if (status === "authenticated" && session) {
    // Ambil role dari session, default ke RESEARCHER jika tidak ada
    const role = (session.user?.role as "ADMIN" | "RESEARCHER") || "RESEARCHER"

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Simple Header */}
        <header className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="font-bold text-xl">Fuzzy Discount Dashboard</h1>
            <div className="text-sm text-gray-600 flex items-center gap-4">
              <span>
                {session.user?.email} • {session.user?.role}
              </span>
              <button 
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Navigasi menggunakan komponen Nav */}
        <Nav role={role} />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>

        <footer className="mt-8 border-t pt-4 text-center text-sm text-gray-500">
          © 2024 Fuzzy Discount System
        </footer>
      </div>
    )
  }

  // Return null jika masih dalam proses redirect
  return null
}