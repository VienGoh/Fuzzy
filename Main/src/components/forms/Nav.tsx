"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo } from "react"

type Role = "ADMIN" | "PENELITI"

const menuItems = [
  { href: "/dashboard", label: "Dashboard", role: ["ADMIN", "PENELITI"] },
  { href: "/products", label: "Produk", role: ["ADMIN", "PENELITI"] },
  { href: "/fuzzy", label: "Input Fuzzy", role: ["ADMIN", "PENELITI"] },
  { href: "/results", label: "Hasil", role: ["ADMIN", "PENELITI"] },
  // { href: "/admin", label: "Admin", role: ["ADMIN"] }, // jika perlu
]

export default function Nav({ role }: { role: Role }) {
  const pathname = usePathname()
  
  const filteredMenu = useMemo(() => 
    menuItems.filter(item => item.role.includes(role)),
    [role]
  )

  return (
    <nav className="flex gap-1 border-b bg-white px-4">
      {filteredMenu.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
              ${isActive 
                ? "bg-white border border-b-0 border-slate-200 text-blue-600" 
                : "text-slate-600 hover:bg-slate-100"
              }
            `}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}