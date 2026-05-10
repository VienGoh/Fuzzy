// src/components/products/ProductFilter.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Search, X, Filter } from 'lucide-react'

interface ProductFilterProps {
  categories: string[]
  brands: string[]
  // Optional: untuk pre-fill nilai dari URL
  initialFilters?: {
    search?: string
    category?: string
    brand?: string
    minDiscount?: string
    maxDiscount?: string
  }
}

export function ProductFilter({ 
  categories, 
  brands, 
  initialFilters = {} 
}: ProductFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State untuk input sementara (belum diterapkan)
  const [tempSearch, setTempSearch] = useState(initialFilters.search || '')
  const [tempCategory, setTempCategory] = useState(initialFilters.category || '')
  const [tempBrand, setTempBrand] = useState(initialFilters.brand || '')
  const [tempMinDiscount, setTempMinDiscount] = useState(initialFilters.minDiscount || '')
  const [tempMaxDiscount, setTempMaxDiscount] = useState(initialFilters.maxDiscount || '')

  // 🔥 Apply filters: update URL + reset page ke 1
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    
    // 🔥 PENTING: Reset ke page 1 setiap kali filter berubah
    params.set('page', '1')
    
    // Update/remove params berdasarkan input
    if (tempSearch) {
      params.set('search', tempSearch)
    } else {
      params.delete('search')
    }
    
    if (tempCategory) {
      params.set('category', tempCategory)
    } else {
      params.delete('category')
    }
    
    if (tempBrand) {
      params.set('brand', tempBrand)
    } else {
      params.delete('brand')
    }
    
    if (tempMinDiscount) {
      params.set('minDiscount', tempMinDiscount)
    } else {
      params.delete('minDiscount')
    }
    
    if (tempMaxDiscount) {
      params.set('maxDiscount', tempMaxDiscount)
    } else {
      params.delete('maxDiscount')
    }
    
    router.push(`/products?${params.toString()}`)
  }

  // 🔥 Reset: hapus semua filter dari URL + reset form
  const resetFilters = () => {
    // Reset local state
    setTempSearch('')
    setTempCategory('')
    setTempBrand('')
    setTempMinDiscount('')
    setTempMaxDiscount('')
    
    // Reset URL (hapus semua filter params, tetap keep page=1)
    const params = new URLSearchParams()
    params.set('page', '1')
    router.push(`/products?${params.toString()}`)
  }

  // Handle enter key pada search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      applyFilters()
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari nama produk..."
            value={tempSearch}
            onChange={(e) => setTempSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-8"
          />
        </div>

        {/* Category */}
        <select
          value={tempCategory}
          onChange={(e) => setTempCategory(e.target.value)}
          className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Brand */}
        <select
          value={tempBrand}
          onChange={(e) => setTempBrand(e.target.value)}
          className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">Semua Brand</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        {/* Min Discount */}
        <Input
          type="number"
          placeholder="Min diskon %"
          value={tempMinDiscount}
          onChange={(e) => setTempMinDiscount(e.target.value)}
          min={0}
          max={100}
          className="h-10"
        />

        {/* Max Discount */}
        <Input
          type="number"
          placeholder="Max diskon %"
          value={tempMaxDiscount}
          onChange={(e) => setTempMaxDiscount(e.target.value)}
          min={0}
          max={100}
          className="h-10"
        />
      </div>

      {/* Actions + Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex gap-2">
          <Button onClick={applyFilters} size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Terapkan Filter
          </Button>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <X className="w-4 h-4 mr-2" />
            Reset Filter
          </Button>
        </div>
        
        {/* Badge filter aktif (opsional, untuk UX) */}
        {(tempSearch || tempCategory || tempBrand || tempMinDiscount || tempMaxDiscount) && (
          <span className="text-sm text-blue-600 font-medium">
            Filter belum diterapkan • Klik "Terapkan Filter" untuk update data
          </span>
        )}
      </div>

      {/* ⚠️ ProductTable DIHAPUS dari sini */}
      {/* Table sekarang dirender di parent page.tsx dengan data dari server */}
    </div>
  )
}