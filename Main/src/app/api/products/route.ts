import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// 🔍 GET produk dengan optimasi select untuk performa
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.toLowerCase().trim() || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const simple = searchParams.get('simple') === 'true'

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { brand: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { category: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          ],
        }
      : {}

if (simple) {
  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      productId: true,
      name: true,
      brand: true,
      category: true,
      metrics: {
        select: {
          stockLevel: true,
          customerRatings: true, // ✅ tambahan
        },
      },
    },
    orderBy: { name: 'asc' },
    take: limit,
  })

  const simplified = products.map((p) => ({
    id: p.id,
    productId: p.productId,
    name: p.name,
    brand: p.brand,
    category: p.category,
    stockLevel: p.metrics?.stockLevel ?? 0,
    customerRatings: p.metrics?.customerRatings ?? null, // ✅ tambahan
  }))
  return NextResponse.json(simplified)
}

const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        productId: true,
        name: true,
        brand: true,
        category: true,
        season: true,
        originalPrice: true,
        competitorPrice: true,
        metrics: {
          select: {
            stockLevel: true,
            seasonalityFactor: true,
            returnRate: true,
            customerRatings: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      take: limit,
    })

    const formatted = products.map((p) => ({
      id: p.id,
      productId: p.productId,
      name: p.name,
      brand: p.brand,
      category: p.category,
      season: p.season,
      originalPrice: p.originalPrice,
      competitorPrice: p.competitorPrice,
      stockLevel: p.metrics?.stockLevel ?? 0,
      seasonalityFactor: p.metrics?.seasonalityFactor ?? null,
      returnRate: p.metrics?.returnRate ?? null,
      customerRatings: p.metrics?.customerRatings ?? null,
    }))

    return NextResponse.json({
      success: true,
      data: formatted,
      count: formatted.length,
    })
  } catch (error) {
    console.error('GET products error:', error)
    const simple = new URL(request.url).searchParams.get('simple') === 'true'
    if (simple) {
      return NextResponse.json([])
    }
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data produk' },
      { status: 500 }
    )
  }
}

// ➕ POST produk baru (tetap, tidak berubah)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      category,
      brand,
      season,
      originalPrice,
      competitorPrice,
      stockLevel,
      seasonalityFactor,
      returnRate,
      customerRatings,
    } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Nama produk wajib diisi' },
        { status: 400 }
      )
    }

    if (!originalPrice) {
      return NextResponse.json(
        { success: false, error: 'Harga asli wajib diisi' },
        { status: 400 }
      )
    }

    const parsedOriginalPrice = parseFloat(originalPrice)
    if (isNaN(parsedOriginalPrice) || parsedOriginalPrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'Harga asli harus berupa angka positif' },
        { status: 400 }
      )
    }

    let parsedCompetitorPrice: number | null = null
    if (competitorPrice) {
      parsedCompetitorPrice = parseFloat(competitorPrice)
      if (isNaN(parsedCompetitorPrice) || parsedCompetitorPrice < 0) {
        return NextResponse.json(
          { success: false, error: 'Harga kompetitor harus berupa angka positif atau nol' },
          { status: 400 }
        )
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const maxProduct = await tx.product.findFirst({
        orderBy: { productId: 'desc' },
        select: { productId: true },
      })
      const nextProductId = (maxProduct?.productId ?? 0) + 1

      const product = await tx.product.create({
        data: {
          productId: nextProductId,
          name: name.trim(),
          category: category || null,
          brand: brand || null,
          season: season || null,
          originalPrice: parsedOriginalPrice,
          competitorPrice: parsedCompetitorPrice,
        },
      })

      const hasMetrics =
        stockLevel !== undefined ||
        seasonalityFactor !== undefined ||
        returnRate !== undefined ||
        customerRatings !== undefined

      if (hasMetrics) {
        await tx.productMetric.create({
          data: {
            productId: product.id,
            stockLevel: stockLevel !== undefined ? parseInt(stockLevel) : 0,
            seasonalityFactor: seasonalityFactor !== undefined ? parseFloat(seasonalityFactor) : 0,
            returnRate: returnRate !== undefined ? parseFloat(returnRate) : 0,
            customerRatings: customerRatings !== undefined ? parseFloat(customerRatings) : 0,
          },
        })
      }

      return product
    })

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    console.error('POST products error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Terjadi konflik saat membuat produk, silakan coba lagi' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Gagal menambah produk: ' + (error instanceof Error ? error.message : 'unknown') },
      { status: 500 }
    )
  }
}