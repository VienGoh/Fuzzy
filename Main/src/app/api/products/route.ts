import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET semua produk
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}

// POST produk baru (dengan autogenerate productId)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, category, brand, season, originalPrice, competitorPrice } = body

    // Validasi field wajib
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Nama produk wajib diisi' },
        { status: 400 }
      )
    }

    if (!originalPrice) {
      return NextResponse.json(
        { error: 'Harga asli wajib diisi' },
        { status: 400 }
      )
    }

    // Validasi harga
    const parsedOriginalPrice = parseFloat(originalPrice)
    if (isNaN(parsedOriginalPrice) || parsedOriginalPrice <= 0) {
      return NextResponse.json(
        { error: 'Harga asli harus berupa angka positif' },
        { status: 400 }
      )
    }

    let parsedCompetitorPrice = null
    if (competitorPrice) {
      parsedCompetitorPrice = parseFloat(competitorPrice)
      if (isNaN(parsedCompetitorPrice) || parsedCompetitorPrice < 0) {
        return NextResponse.json(
          { error: 'Harga kompetitor harus berupa angka positif atau nol' },
          { status: 400 }
        )
      }
    }

    // ===== AUTOGENERATE productId dengan pendekatan yang lebih aman =====
    // Gunakan transaction untuk menghindari race condition
    const product = await prisma.$transaction(async (tx) => {
      // Cari productId terbesar saat ini
      const maxProduct = await tx.product.findFirst({
        orderBy: { productId: 'desc' },
        select: { productId: true }
      })
      const nextProductId = (maxProduct?.productId ?? 0) + 1

      // Simpan produk baru
      return tx.product.create({
        data: {
          productId: nextProductId,
          name: name.trim(),
          category: category || null,
          brand: brand || null,
          season: season || null,
          originalPrice: parsedOriginalPrice,
          competitorPrice: parsedCompetitorPrice,
        }
      })
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('POST error:', error)

    // Tangani error Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Kode P2002 = unique constraint violation (productId duplikat)
      if (error.code === 'P2002') {
        // Coba lagi? Atau kembalikan error
        return NextResponse.json(
          { error: 'Terjadi konflik saat membuat produk, silakan coba lagi' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Gagal menambah produk: ' + (error instanceof Error ? error.message : 'unknown') },
      { status: 500 }
    )
  }
}