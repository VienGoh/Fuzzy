// app/api/fuzzy/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hitungFuzzy } from '@/lib/fuzzy' // fungsi yang akan kita buat

export async function POST(req: NextRequest) {
  try {
    const { stok, permintaan, loyalitas, productId } = await req.json()

    // Validasi input
    if (typeof stok !== 'number' || typeof permintaan !== 'number' || typeof loyalitas !== 'number') {
      return NextResponse.json({ error: 'Input harus angka' }, { status: 400 })
    }
    if (stok < 0 || stok > 100 || permintaan < 0 || permintaan > 100 || loyalitas < 0 || loyalitas > 5) {
      return NextResponse.json({ error: 'Nilai di luar jangkauan' }, { status: 400 })
    }

    // Hitung fuzzy
    const result = hitungFuzzy(stok, permintaan, loyalitas)

    // Simpan ke database
    await prisma.discountResult.create({
      data: {
        productId: productId || null,
        inputValues: { stok, permintaan, loyalitas },
        calculatedDiscount: result.diskon
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}