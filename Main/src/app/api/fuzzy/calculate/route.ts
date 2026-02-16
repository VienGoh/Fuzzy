import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hitungDiskon } from '@/lib/fuzzy'

export async function POST(request: Request) {
  try {
    const { productId, stok, permintaan, loyalitas } = await request.json()

    // Validasi
    if (stok === undefined || permintaan === undefined || loyalitas === undefined) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 })
    }

    // Hitung diskon
    const diskon = hitungDiskon(Number(stok), Number(permintaan), Number(loyalitas))

    // Simpan ke database
    const result = await prisma.discountResult.create({
      data: {
        productId: productId ? parseInt(productId) : null,
        inputValues: { stok, permintaan, loyalitas },
        calculatedDiscount: diskon
      }
    })

    return NextResponse.json({ diskon, id: result.id })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}