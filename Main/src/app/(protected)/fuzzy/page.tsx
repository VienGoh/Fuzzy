// src/app/(protected)/fuzzy/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/forms/Nav';

type ProductOption = {
  id: number;
  productId: number;
  name: string;
  brand: string | null;
  category: string | null;
  stockLevel: number;
};

export default function FuzzyInputPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stock, setStock] = useState<string>('');
  const [demand, setDemand] = useState<string>('');
  const [loyalty, setLoyalty] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  // ✅ Perbaiki: pakai parameter simple=true dan pastikan data array
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?simple=true');
        if (!res.ok) throw new Error('Gagal mengambil produk');
        const data = await res.json();
        // Pastikan data adalah array
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError('Gagal memuat daftar produk');
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    setSelectedProductId(productId);
    const selected = products.find((p) => p.id.toString() === productId);
    if (selected) {
      setStock(selected.stockLevel.toString());
    } else {
      setStock('');
    }
  };

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

    if (isNaN(stockNum) || stockNum < 0 || stockNum > 200) {
      setError('Stok harus antara 0 - 200');
      setLoading(false);
      return;
    }

    if (isNaN(demandNum) || demandNum < 0 || demandNum > 500) {
      setError('Permintaan harus antara 0 - 500');
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
        body: JSON.stringify({
          stock: stockNum,
          demand: demandNum,
          loyalty: loyaltyNum,
          productId: selectedProductId ? parseInt(selectedProductId) : null,
        }),
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
    setSelectedProductId('');
    setResult(null);
    setError(null);
  };

  const role = (session?.user?.role as 'ADMIN' | 'PENELITI') || 'PENELITI';

  return (
    <>
      <Nav role={role} />
      <div className="container mx-auto p-6 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Input Data Fuzzy</h1>
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Pilih Produk</label>
            <select
              className="shadow border rounded w-full py-2 px-3"
              value={selectedProductId}
              onChange={handleProductChange}
              disabled={loadingProducts}
            >
              <option value="">-- Pilih Produk --</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} {product.brand ? `- ${product.brand}` : ''} (Stok: {product.stockLevel})
                </option>
              ))}
            </select>
            {loadingProducts && <p className="text-gray-500 text-xs mt-1">Memuat produk...</p>}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Jumlah Stok (0 - 200)</label>
            <input
              className="shadow border rounded w-full py-2 px-3"
              type="number"
              step="any"
              min="0"
              max="200"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Contoh: 150"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Tingkat Permintaan (0 - 500)</label>
            <input
              className="shadow border rounded w-full py-2 px-3"
              type="number"
              step="any"
              min="0"
              max="500"
              value={demand}
              onChange={(e) => setDemand(e.target.value)}
              placeholder="Contoh: 243"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Loyalitas Pelanggan (0 - 5)</label>
            <input
              className="shadow border rounded w-full py-2 px-3"
              type="number"
              step="any"
              min="0"
              max="5"
              value={loyalty}
              onChange={(e) => setLoyalty(e.target.value)}
              placeholder="Contoh: 4.5"
              required
            />
          </div>

          <div className="flex justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Menghitung...' : 'Hitung Diskon'}
            </button>
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              type="button"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-4">{error}</p>}
        </form>

        {result && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <h2 className="text-xl font-semibold mb-2">Hasil Perhitungan</h2>
            <p><strong>Stok:</strong> {result.inputValues.stock}</p>
            <p><strong>Permintaan:</strong> {result.inputValues.demand}</p>
            <p><strong>Loyalitas:</strong> {result.inputValues.loyalty}</p>
            {result.productName && <p><strong>Produk:</strong> {result.productName}</p>}
            <p className="text-2xl font-bold text-green-700 mt-2">Diskon: {result.calculatedDiscount}%</p>
            <p className="text-sm text-gray-500 mt-2">Waktu: {new Date(result.timestamp).toLocaleString()}</p>
          </div>
        )}
      </div>
    </>
  );
}   