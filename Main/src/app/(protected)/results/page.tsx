import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Nav from '@/components/forms/Nav';
import ResultsTable from '@/components/results/ResultTable'; // client component untuk tabel interaktif (opsional)
import DiscountChart from '@/components/results/DiscountTable'; // client component untuk grafik

export default async function ResultsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as "ADMIN" | "PENELITI") || "PENELITI";

  // Ambil semua hasil perhitungan, urutkan dari terbaru
  const results = await prisma.discountResult.findMany({
    orderBy: { timestamp: 'desc' },
  });

  // Ambil juga data produk untuk perbandingan (misalnya 10 produk dengan optimal discount)
  const products = await prisma.product.findMany({
    where: { optimalDiscount: { not: null } },
    take: 10,
    orderBy: { optimalDiscount: 'desc' },
    select: { name: true, optimalDiscount: true },
  });

  // Hitung statistik sederhana
  const totalResults = results.length;
  const avgDiscount = results.reduce((acc, r) => acc + r.calculatedDiscount, 0) / (totalResults || 1);

  return (
    <>
      <Nav role={role} />
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Hasil Perhitungan Diskon</h1>

        {/* Ringkasan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">Total Perhitungan</p>
            <p className="text-2xl font-bold">{totalResults}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">Rata-rata Diskon Sistem</p>
            <p className="text-2xl font-bold">{avgDiscount.toFixed(2)}%</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">Perhitungan Terakhir</p>
            <p className="text-sm">{results[0] ? new Date(results[0].timestamp).toLocaleString('id-ID') : '-'}</p>
          </div>
        </div>

        {/* Grafik */}
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Distribusi Diskon Hasil Sistem</h2>
          <DiscountChart results={results} />
        </div>

        {/* Tabel Hasil */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Riwayat Perhitungan</h2>
          <ResultsTable results={results} />
        </div>

        {/* (Opsional) Perbandingan dengan Data Aktual */}
        {products.length > 0 && (
          <div className="bg-white p-4 rounded shadow mt-6">
            <h2 className="text-xl font-semibold mb-4">Contoh Data Aktual (Top 10 Diskon Optimal)</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Nama Produk</th>
                  <th className="text-right py-2">Diskon Optimal</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">{p.name || `Produk ${i+1}`}</td>
                    <td className="py-2 text-right">{p.optimalDiscount?.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}