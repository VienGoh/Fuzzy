import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const results = await prisma.discountResult.findMany({
      take: limit,
      skip,
      orderBy: { timestamp: 'desc' },
      include: { product: true }
    })

    const total = await prisma.discountResult.count()

    return NextResponse.json({
      data: results,
      meta: { page, limit, total }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}