'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function ProductForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    originalPrice: '',
    competitorPrice: '',
    optimalDiscount: '',
    stockLevel: '',
    seasonalityFactor: '',
    returnRate: '',
    customerRatings: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        router.push('/products')
        router.refresh()
      } else {
        alert('Gagal menyimpan')
      }
    } catch (error) {
      alert('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nama Produk</label>
        <Input name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Kategori</label>
        <Input name="category" value={formData.category} onChange={handleChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Brand</label>
        <Input name="brand" value={formData.brand} onChange={handleChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Harga Asli</label>
        <Input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Harga Kompetitor</label>
        <Input type="number" name="competitorPrice" value={formData.competitorPrice} onChange={handleChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Diskon Optimal (%)</label>
        <Input type="number" name="optimalDiscount" value={formData.optimalDiscount} onChange={handleChange} step="0.01" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Stok</label>
        <Input type="number" name="stockLevel" value={formData.stockLevel} onChange={handleChange} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Faktor Musiman</label>
        <Input type="number" name="seasonalityFactor" value={formData.seasonalityFactor} onChange={handleChange} step="0.01" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Tingkat Pengembalian (%)</label>
        <Input type="number" name="returnRate" value={formData.returnRate} onChange={handleChange} step="0.01" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Rating Pelanggan</label>
        <Input type="number" name="customerRatings" value={formData.customerRatings} onChange={handleChange} step="0.1" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
      </div>
    </form>
  )
}