// src/app/(protected)/products/page.tsx
import { prisma } from '@/lib/prisma'
import { ProductTable } from '@/components/products/ProductTable'
import { ProductFilter } from '@/components/products/ProductFilter'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Nav from '@/components/forms/Nav'

export default async function ProductsPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user?.role as "ADMIN" | "PENELITI") || "PENELITI"

  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' }
  })

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[]
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))] as string[]

  return (
    <div className="space-y-6">
      {/* Navigasi */}
      <Nav role={role} />

      {/* Header dengan judul dan tombol tambah */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Data Produk</h1>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Produk
          </Link>
        </Button>
      </div>

      <ProductFilter 
        products={products} 
        categories={categories}
        brands={brands}
      />
    </div>
  )
}