'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/forms/Nav'; // <-- Tambahkan Nav

export default function FuzzyInputPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stock, setStock] = useState<string>('');
  const [demand, setDemand] = useState<string>('');
  const [loyalty, setLoyalty] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    calculatedDiscount: number;
    inputValues: { stock: number; demand: number; loyalty: number };
    timestamp: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const stockNum = parseFloat(stock);
    const demandNum = parseFloat(demand);
    const loyaltyNum = parseFloat(loyalty);

    // Validasi rentang
    if (isNaN(stockNum) || stockNum < 0 || stockNum > 100) {
      setError('Stok harus antara 0 - 100');
      setLoading(false);
      return;
    }
    if (isNaN(demandNum) || demandNum < 0 || demandNum > 100) {
      setError('Permintaan harus antara 0 - 100');
      setLoading(false);
      return;
    }
    if (isNaN(loyaltyNum) || loyaltyNum < 0 || loyaltyNum > 5) {
      setError('Loyalitas harus antara 0 - 5');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/calculate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: stockNum, demand: demandNum, loyalty: loyaltyNum }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal menghitung diskon');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStock('');
    setDemand('');
    setLoyalty('');
    setResult(null);
    setError(null);
  };

  // Ambil role dari session
  const role = (session?.user?.role as "ADMIN" | "PENELITI") || "PENELITI";

  return (
    <>
      {/* Navigasi ditambahkan di sini, sama seperti di dashboard */}
      <Nav role={role} />
      
      <div className="container mx-auto p-6 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Input Data Fuzzy</h1>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="stock">
              Jumlah Stok (0 - 100)
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="stock"
              type="number"
              step="any"
              min="0"
              max="100"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Contoh: 60"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="demand">
              Tingkat Permintaan (0 - 100)
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="demand"
              type="number"
              step="any"
              min="0"
              max="100"
              value={demand}
              onChange={(e) => setDemand(e.target.value)}
              placeholder="Contoh: 30"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="loyalty">
              Loyalitas Pelanggan (0 - 5)
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="loyalty"
              type="number"
              step="any"
              min="0"
              max="5"
              value={loyalty}
              onChange={(e) => setLoyalty(e.target.value)}
              placeholder="Contoh: 4.2"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Menghitung...' : 'Hitung Diskon'}
            </button>
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>

          {error && <p className="text-red-500 text-xs italic mt-4">{error}</p>}
        </form>

        {result && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <h2 className="text-xl font-semibold mb-2">Hasil Perhitungan</h2>
            <p><strong>Stok:</strong> {result.inputValues.stock}</p>
            <p><strong>Permintaan:</strong> {result.inputValues.demand}</p>
            <p><strong>Loyalitas:</strong> {result.inputValues.loyalty}</p>
            <p className="text-2xl font-bold text-green-700 mt-2">Diskon: {result.calculatedDiscount}%</p>
            <p className="text-sm text-gray-500 mt-2">Waktu: {new Date(result.timestamp).toLocaleString()}</p>
          </div>
        )}
      </div>
    </>
  );
}