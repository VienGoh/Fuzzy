// src/components/ui/Pagination.tsx
'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl?: string
  additionalParams?: Record<string, string>
}

export default function Pagination({
  currentPage,
  totalPages,
  baseUrl = '/products',
  additionalParams = {},
}: PaginationProps) {
  const searchParams = useSearchParams()

  // 🔥 Helper: Build URL pagination yang preserve filter
  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', pageNumber.toString())
    
    // Merge additional params (jika ada)
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    
    return `${baseUrl}?${params.toString()}`
  }

  // Generate array page numbers dengan ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border rounded-lg">
      {/* Info */}
      <div className="text-sm text-gray-600">
        Halaman <span className="font-medium">{currentPage}</span> dari{' '}
        <span className="font-medium">{totalPages}</span>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={currentPage === 1}
          className="disabled:opacity-50"
        >
          <Link href={createPageUrl(currentPage - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) => (
            <Button
              key={idx}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              asChild={typeof page === 'number'}
              className={typeof page === 'number' ? 'w-8 h-8 p-0' : 'cursor-default'}
              disabled={typeof page === 'string'}
            >
              {typeof page === 'number' ? (
                <Link href={createPageUrl(page)}>{page}</Link>
              ) : (
                <span>...</span>
              )}
            </Button>
          ))}
        </div>

        {/* Next */}
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={currentPage === totalPages}
          className="disabled:opacity-50"
        >
          <Link href={createPageUrl(currentPage + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}