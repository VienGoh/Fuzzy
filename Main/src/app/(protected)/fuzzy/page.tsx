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
  customerRatings?: number | null;
};

export default function FuzzyInputPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stock, setStock] = useState<string>('');
  const [demand, setDemand] = useState<string>('');
  const [loyalty, setLoyalty] = useState<string>('0.0'); // default 0.0
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?simple=true');
        if (!res.ok) throw new Error('Gagal mengambil produk');
        const data = await res.json();
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
      if (selected.customerRatings !== undefined && selected.customerRatings !== null) {
        setLoyalty(selected.customerRatings.toFixed(1));
      } else {
        setLoyalty('0.0'); // kosong → 0.0
      }
    } else {
      setStock('');
      setLoyalty('0.0');
    }
  };

  const parseLoyaltyInput = (value: string): number => {
    let normalized = value.trim().replace(',', '.');
    normalized = normalized.replace(/[^0-9.-]/g, '');
    const num = parseFloat(normalized);
    return isNaN(num) ? NaN : num;
  };

  const formatToSingleDecimal = (value: number): string => {
    if (isNaN(value)) return '0.0';
    let clamped = Math.min(5, Math.max(0, value));
    return clamped.toFixed(1);
  };

  const handleLoyaltyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    let filtered = raw.replace(/[^0-9.,]/g, '');
    const dots = (filtered.match(/\./g) || []).length;
    const commas = (filtered.match(/,/g) || []).length;
    if (dots > 1 || commas > 1) return;
    if (filtered.includes('..') || filtered.includes(',,')) return;

    let num = parseLoyaltyInput(filtered);
    if (!isNaN(num) && num > 5) return;
    setLoyalty(filtered);
  };

  const handleLoyaltyBlur = () => {
    if (loyalty.trim() === '') {
      setLoyalty('0.0'); // kosong → 0.0
      return;
    }
    let num = parseLoyaltyInput(loyalty);
    if (isNaN(num)) {
      setLoyalty('0.0');
      return;
    }
    num = Math.min(5, Math.max(0, num));
    setLoyalty(num.toFixed(1));
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
    let loyaltyNum = parseLoyaltyInput(loyalty);

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
    if (isNaN(loyaltyNum)) {
      loyaltyNum = 0; // fallback
    }
    loyaltyNum = Math.min(5, Math.max(0, loyaltyNum));

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
    setLoyalty('0.0'); // reset ke 0.0
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
                  {product.customerRatings ? `, Rating: ${product.customerRatings.toFixed(1)}` : ''}
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
              type="text"
              value={loyalty}
              onChange={handleLoyaltyChange}
              onBlur={handleLoyaltyBlur}
              placeholder="Contoh: 4.1 atau 4,1"
              required
            />
            <p className="text-gray-500 text-xs mt-1">
              Masukkan angka 0 - 5 (satu desimal, misal 4.1). Kosong akan diisi 0.0.
            </p>
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