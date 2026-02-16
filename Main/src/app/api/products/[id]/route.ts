import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, name, category, brand, season, originalPrice, competitorPrice } = body

    // Validasi productId harus ada dan unik
    if (!productId) {
      return NextResponse.json({ error: 'Product ID wajib diisi' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        productId: parseInt(productId),   // konversi ke integer
        name,
        category,
        brand,
        season,
        originalPrice: parseFloat(originalPrice),
        competitorPrice: competitorPrice ? parseFloat(competitorPrice) : null,
      }
    })
    return NextResponse.json(product)
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json({ error: 'Gagal menambah produk' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }
    const product = await prisma.product.findUnique({
      where: { id },
      include: { metrics: true } // sertakan metric jika perlu
    })
    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(product)
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }
    const body = await request.json()
    const { name, category, brand, season, originalPrice, competitorPrice, optimalDiscount } = body

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        category,
        brand,
        season,
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        competitorPrice: competitorPrice ? parseFloat(competitorPrice) : null,
        optimalDiscount: optimalDiscount ? parseFloat(optimalDiscount) : null,
      }
    })
    return NextResponse.json(product)
  } catch (error) {
    console.error('PUT error:', error)
    return NextResponse.json({ error: 'Gagal mengupdate' }, { status: 500 })
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Tanda tipe diubah menjadi Promise
) {
  try {
    // ⭐️ Tambahkan await pada params
    const { id } = await params;

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    // ... (logika hapus seperti transaksi Anda sebelumnya)
    const existingProduct = await prisma.product.findUnique({
      where: { id: parsedId }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.salesHistory.deleteMany({ where: { productId: parsedId } }),
      prisma.promotion.deleteMany({ where: { productId: parsedId } }),
      prisma.productMetric.deleteMany({ where: { productId: parsedId } }),
      prisma.discountResult.deleteMany({ where: { productId: parsedId } }),
      prisma.product.delete({ where: { id: parsedId } })
    ]);

    return NextResponse.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    // ... (penanganan error)
    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 });
  }
}


