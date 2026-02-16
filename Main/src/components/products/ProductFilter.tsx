"use client"

import { useState, useMemo } from 'react'
import { ProductTable } from './ProductTable'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Search, X, Filter } from 'lucide-react'

interface Product {
  id: number
  name: string
  category?: string | null
  brand?: string | null
  originalPrice: number
  optimalDiscount?: number | null
}

interface ProductFilterProps {
  products: Product[]
  categories: string[]
  brands: string[]
}

export function ProductFilter({ products, categories, brands }: ProductFilterProps) {
  // State untuk input (sementara)
  const [tempSearch, setTempSearch] = useState('')
  const [tempCategory, setTempCategory] = useState('')
  const [tempBrand, setTempBrand] = useState('')
  const [tempMinDiscount, setTempMinDiscount] = useState('')
  const [tempMaxDiscount, setTempMaxDiscount] = useState('')

  // State untuk filter yang aktif (setelah tombol Terapkan diklik)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [minDiscount, setMinDiscount] = useState('')
  const [maxDiscount, setMaxDiscount] = useState('')

  const applyFilters = () => {
    setSearch(tempSearch)
    setCategory(tempCategory)
    setBrand(tempBrand)
    setMinDiscount(tempMinDiscount)
    setMaxDiscount(tempMaxDiscount)
  }

  const resetFilters = () => {
    setTempSearch('')
    setTempCategory('')
    setTempBrand('')
    setTempMinDiscount('')
    setTempMaxDiscount('')
    setSearch('')
    setCategory('')
    setBrand('')
    setMinDiscount('')
    setMaxDiscount('')
  }

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (search && !product.name.toLowerCase().includes(search.toLowerCase())) return false
      if (category && product.category !== category) return false
      if (brand && product.brand !== brand) return false
      const discount = product.optimalDiscount ?? 0
      if (minDiscount && discount < parseFloat(minDiscount)) return false
      if (maxDiscount && discount > parseFloat(maxDiscount)) return false
      return true
    })
  }, [products, search, category, brand, minDiscount, maxDiscount])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari nama produk..."
            value={tempSearch}
            onChange={(e) => setTempSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <select
          value={tempCategory}
          onChange={(e) => setTempCategory(e.target.value)}
          className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">Semua Kategori</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={tempBrand}
          onChange={(e) => setTempBrand(e.target.value)}
          className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">Semua Brand</option>
          {brands.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <Input
          type="number"
          placeholder="Min diskon %"
          value={tempMinDiscount}
          onChange={(e) => setTempMinDiscount(e.target.value)}
          min={0}
          max={100}
        />

        <Input
          type="number"
          placeholder="Max diskon %"
          value={tempMaxDiscount}
          onChange={(e) => setTempMaxDiscount(e.target.value)}
          min={0}
          max={100}
        />
      </div>

      <div className="flex justify-between items-center">
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
        <span className="text-sm text-gray-500">
          Menampilkan {filteredProducts.length} dari {products.length} produk
        </span>
      </div>

      <ProductTable products={filteredProducts} />
    </div>
  )
}