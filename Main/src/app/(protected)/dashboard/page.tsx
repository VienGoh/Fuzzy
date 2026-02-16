// src/app/(protected)/dashboard/page.tsx
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/Card'
import Nav from '@/components/forms/Nav' // <-- Tambahkan impor Nav
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function DashboardPage() {
  // Ambil session untuk role
  const session = await getServerSession(authOptions)
  const role = (session?.user?.role as "ADMIN" | "PENELITI") || "PENELITI"

  // ============================================
  // AMBIL SEMUA DATA YANG DIPERLUKAN DARI DATABASE
  // ============================================
  
  // 1. Total produk
  const totalProducts = await prisma.product.count()
  
  // 2. Rata-rata diskon dari sistem (hasil perhitungan fuzzy)
  const avgSystem = await prisma.discountResult.aggregate({
    _avg: { calculatedDiscount: true }
  })

  // 3. Rata-rata diskon optimal dari produk (data aktual dari CSV)
  const avgOptimal = await prisma.product.aggregate({
    _avg: { optimalDiscount: true }
  })

  // 4. Ambil semua data untuk perhitungan MAE (Mean Absolute Error)
  const [systemResults, optimalProducts] = await Promise.all([
    prisma.discountResult.findMany({
      select: { calculatedDiscount: true }
    }),
    prisma.product.findMany({
      where: { optimalDiscount: { not: null } },
      select: { optimalDiscount: true }
    })
  ])

  // 5. Hitung MAE (Mean Absolute Error)
  let maeValue = 0
  const validPairs = Math.min(systemResults.length, optimalProducts.length)
  
  if (validPairs > 0) {
    let totalError = 0
    for (let i = 0; i < validPairs; i++) {
      const sys = systemResults[i].calculatedDiscount || 0
      const opt = optimalProducts[i].optimalDiscount || 0
      totalError += Math.abs(sys - opt)
    }
    maeValue = totalError / validPairs
  }

  // 6. Ambil data untuk chart (opsional - 10 produk teratas)
  const topProducts = await prisma.product.findMany({
    take: 10,
    orderBy: { optimalDiscount: 'desc' },
    select: {
      name: true,
      optimalDiscount: true,
    }
  })

  // ============================================
  // FORMAT ANGKA UNTUK TAMPILAN
  // ============================================
  const sistem = (avgSystem._avg.calculatedDiscount ?? 0).toFixed(1)
  const aktual = (avgOptimal._avg.optimalDiscount ?? 0).toFixed(1)
  const selisih = (Math.abs(parseFloat(sistem) - parseFloat(aktual))).toFixed(1)
  const mae = maeValue.toFixed(2)
  const totalProduk = totalProducts.toLocaleString('id-ID')

  return (
    <div className="space-y-6">
      {/* Navigasi ditambahkan di sini */}
      <Nav role={role} />

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}
        </p>
      </div>

      {/* KARTU STATISTIK UTAMA (4 KARTU) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kartu 1: Rata-rata Diskon Sistem */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rata-rata Diskon Sistem</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{sistem}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Dari {systemResults.length} hasil perhitungan</p>
          </CardContent>
        </Card>

        {/* Kartu 2: Rata-rata Diskon Aktual */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rata-rata Diskon Aktual</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{aktual}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Dari {totalProducts} produk</p>
          </CardContent>
        </Card>

        {/* Kartu 3: Selisih Rata-rata */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Selisih Rata-rata</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{selisih}%</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">|{sistem}% - {aktual}%|</p>
          </CardContent>
        </Card>

        {/* Kartu 4: Mean Absolute Error */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Mean Absolute Error</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{mae}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Berdasarkan {validPairs} data berpasangan</p>
          </CardContent>
        </Card>
      </div>

      {/* RINGKASAN DATABASE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700">Total Produk</h3>
            <p className="text-2xl font-bold text-gray-900">{totalProduk}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700">Produk dengan Diskon Optimal</h3>
            <p className="text-2xl font-bold text-gray-900">{optimalProducts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700">Hasil Perhitungan Fuzzy</h3>
            <p className="text-2xl font-bold text-gray-900">{systemResults.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* 10 PRODUK TERATAS (BERDASARKAN DISKON OPTIMAL) */}
      {topProducts.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Top 10 Produk dengan Diskon Optimal Tertinggi</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">No</th>
                    <th className="text-left py-2">Nama Produk</th>
                    <th className="text-right py-2">Diskon Optimal</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2">{index + 1}</td>
                      <td className="py-2">{product.name || `Produk ${index + 1}`}</td>
                      <td className="py-2 text-right font-medium text-green-600">
                        {product.optimalDiscount?.toFixed(1) ?? '0'}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* INFORMASI DATABASE */}
      <div className="text-sm text-gray-500 mt-4 border-t pt-4">
        <p>Total data dalam database:</p>
        <ul className="list-disc list-inside mt-2">
          <li>Produk: {totalProducts} item</li>
          <li>Hasil perhitungan fuzzy: {systemResults.length} item</li>
          <li>Data berpasangan untuk MAE: {validPairs} item</li>
        </ul>
      </div>
    </div>
  )
}