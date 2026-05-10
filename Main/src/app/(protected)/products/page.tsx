// src/app/(protected)/products/page.tsx
import { prisma } from '@/lib/prisma'
import { ProductTable } from '@/components/products/ProductTable'
import { ProductFilter } from '@/components/products/ProductFilter'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Plus, X } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Nav from '@/components/forms/Nav'
import Pagination from '@/components/ui/Pagination'

interface PageProps {
  searchParams: Promise<{ 
    page?: string
    category?: string
    brand?: string
    search?: string
  }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  const role = (session?.user?.role as "ADMIN" | "PENELITI") || "PENELITI"

  const params = await searchParams
  
  // 🔥 FIX: Reset ke page 1 jika ada filter aktif
  const hasActiveFilters = params.category || params.brand || params.search
  const page = hasActiveFilters 
    ? 1 
    : Math.max(1, parseInt(params.page || '1'))
    
  const limit = 10
  const skip = (page - 1) * limit

  // Build filter conditions untuk Prisma
  const filters: any = {}
  if (params.category) filters.category = params.category
  if (params.brand) filters.brand = params.brand
  if (params.search) {
    filters.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { brand: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  // Ambil data dengan Promise.all untuk parallel execution
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
      where: { category: { not: null } }
    }),
    prisma.product.findMany({
      select: { brand: true },
      distinct: ['brand'],
      where: { brand: { not: null } }
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

  const categories = allCategories
    .map(c => c.category)
    .filter((c): c is string => !!c)
    .sort()
    
  const brands = allBrands
    .map(b => b.brand)
    .filter((b): b is string => !!b)
    .sort()

  // Build URL untuk reset filter
  const resetUrl = '/products'

  return (
    <div className="space-y-6">
      <Nav role={role} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Data Produk</h1>
          
          {/* 🔥 Badge Filter Aktif */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-500">Filter:</span>
              {params.search && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Search: "{params.search}"
                </span>
              )}
              {params.category && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  Kategori: {params.category}
                </span>
              )}
              {params.brand && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                  Brand: {params.brand}
                </span>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Link href={resetUrl}>
                  <X className="w-3 h-3 mr-1" />
                  Reset
                </Link>
              </Button>
            </div>
          )}
        </div>
        
        <Button asChild>
          <Link href="/products/new">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Produk
          </Link>
        </Button>
      </div>

      {/* Filter Component */}
      <ProductFilter
        categories={categories}
        brands={brands}
        currentFilters={{
          category: params.category,
          brand: params.brand,
          search: params.search,
        }}
      />

      {/* Product Table */}
      <ProductTable 
        products={formattedProducts} 
        totalCount={totalCount}
        role={role}
      />

      {/* Pagination - hanya tampilkan jika ada data */}
      {totalPages > 1 && (
        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
          baseUrl="/products"
          additionalParams={{
            ...(params.category && { category: params.category }),
            ...(params.brand && { brand: params.brand }),
            ...(params.search && { search: params.search }),
          }}
        />
      )}

      {/* Empty State */}
      {formattedProducts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
          <p className="text-gray-500">
            {hasActiveFilters 
              ? "Tidak ada produk yang sesuai dengan filter." 
              : "Belum ada produk."
            }
          </p>
          {hasActiveFilters && (
            <Button 
              variant="link" 
              asChild 
              className="mt-2 text-blue-600"
            >
              <Link href={resetUrl}>Lihat semua produk</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}