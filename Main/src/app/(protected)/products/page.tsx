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
import Pagination from '@/components/ui/Pagination'

interface PageProps {
  searchParams: Promise<{ page?: string; category?: string; brand?: string; search?: string }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  const role = (session?.user?.role as "ADMIN" | "PENELITI") || "PENELITI"

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1'))
  const limit = 10  // jumlah per halaman
  const skip = (page - 1) * limit

  // Filter kondisi
  const filters: any = {}
  if (params.category) filters.category = params.category
  if (params.brand) filters.brand = params.brand
  if (params.search) {
    filters.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { brand: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  // Ambil data produk dengan paginasi (hanya field yang diperlukan)
  const [products, totalCount, allCategories, allBrands] = await Promise.all([
    prisma.product.findMany({
      where: filters,
      select: {
        id: true,
        productId: true,
        name: true,
        brand: true,
        category: true,
        originalPrice: true,
        competitorPrice: true,
        metrics: {
          select: { stockLevel: true }
        }
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where: filters }),
    prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    }),
    prisma.product.findMany({
      select: { brand: true },
      distinct: ['brand'],
    }),
  ])

  const totalPages = Math.ceil(totalCount / limit)

  // Format produk untuk tabel
  const formattedProducts = products.map(p => ({
    id: p.id,
    productId: p.productId,
    name: p.name,
    brand: p.brand,
    category: p.category,
    originalPrice: p.originalPrice,
    competitorPrice: p.competitorPrice,
    stockLevel: p.metrics?.stockLevel ?? 0,
  }))

  const categories = allCategories.map(c => c.category).filter(Boolean) as string[]
  const brands = allBrands.map(b => b.brand).filter(Boolean) as string[]

  return (
    <div className="space-y-6">
      <Nav role={role} />

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
        products={formattedProducts}
        categories={categories}
        brands={brands}
      />

      {/* Pagination */}
      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  )
}