'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function NewProductPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    productId: '',          // <-- tambahkan
    name: '',
    category: '',
    brand: '',
    season: '',
    originalPrice: '',
    competitorPrice: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          productId: parseInt(form.productId),   // konversi ke number
          originalPrice: parseFloat(form.originalPrice),
          competitorPrice: form.competitorPrice ? parseFloat(form.competitorPrice) : null
        })
      })
      if (res.ok) {
        router.push('/products')
        router.refresh()
      } else {
        const err = await res.json()
        alert(err.error || 'Gagal menyimpan')
      }
    } catch (error) {
      alert('Terjadi kesalahan')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Tambah Produk Baru</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Field Product ID (wajib) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product ID * <span className="text-xs text-gray-500">(angka unik)</span>
          </label>
          <Input
            type="number"
            required
            value={form.productId}
            onChange={e => setForm({...form, productId: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nama Produk *</label>
          <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Kategori</label>
          <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Brand</label>
          <Input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Musim</label>
          <Input value={form.season} onChange={e => setForm({...form, season: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Harga Asli *</label>
          <Input type="number" required value={form.originalPrice} onChange={e => setForm({...form, originalPrice: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Harga Kompetitor</label>
          <Input type="number" value={form.competitorPrice} onChange={e => setForm({...form, competitorPrice: e.target.value})} />
        </div>
        <div className="flex gap-4">
          <Button type="submit">Simpan</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
        </div>
      </form>
    </div>
  )
}