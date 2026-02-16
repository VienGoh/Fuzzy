// app/api/results/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const results = await prisma.discountResult.findMany({
      take: 100,
      orderBy: { timestamp: 'desc' },
      include: { product: true }
    })
    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}