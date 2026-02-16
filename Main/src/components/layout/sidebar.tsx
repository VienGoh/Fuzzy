// components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Percent,
  BarChart3,
  Settings,
  Users,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Input Data",
    href: "/input",
    icon: Package,
  },
  {
    name: "Hasil Perhitungan",
    href: "/results",
    icon: Percent,
  },
  {
    name: "Visualisasi",
    href: "/visualization",
    icon: BarChart3,
  },
  {
    name: "Aturan Fuzzy",
    href: "/rules",
    icon: Settings,
  },
  {
    name: "Data Produk",
    href: "/products",
    icon: ShoppingCart,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      <div className="p-6">
        <h2 className="text-2xl font-bold">Fuzzy Diskon</h2>
        <p className="text-gray-400 text-sm mt-1">Sistem Penentuan Diskon</p>
      </div>

      <nav className="flex-1 mt-2">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-6 border-t border-gray-800">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="font-bold">JW</span>
          </div>
          <div className="ml-3">
            <p className="font-medium">Jessica Wijaya</p>
            <p className="text-sm text-gray-400">NIM. 2245016</p>
          </div>
        </div>
      </div>
    </div>
  );
}