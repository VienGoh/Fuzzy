import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Ambil 10 data terakhir dari discount_results
    const system = await prisma.discountResult.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      select: { calculatedDiscount: true }
    })

    // Ambil 10 data dari sales_history (optimalDiscount)
    const actual = await prisma.salesHistory.findMany({
      take: 10,
      orderBy: { date: 'desc' },
      select: { optimalDiscount: true }
    })

    // Gabungkan dalam format yang siap untuk grafik (sistem vs aktual)
    const maxLength = Math.min(system.length, actual.length)
    const comparison = []
    for (let i = 0; i < maxLength; i++) {
      comparison.push({
        sistem: system[i].calculatedDiscount,
        aktual: actual[i].optimalDiscount ?? 0
      })
    }

    return NextResponse.json(comparison)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}