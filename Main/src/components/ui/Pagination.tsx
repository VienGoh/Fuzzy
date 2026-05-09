// components/ui/Pagination.tsx
'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export default function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  // Tampilkan maksimal 5 halaman di sekitar
  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex justify-center gap-2 mt-6">
      {currentPage > 1 && (
        <Link href={createPageURL(currentPage - 1)} className="px-3 py-2 rounded border hover:bg-gray-100">
          Prev
        </Link>
      )}
      {pages.map(p => (
        <Link
          key={p}
          href={createPageURL(p)}
          className={`px-3 py-2 rounded border ${p === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
        >
          {p}
        </Link>
      ))}
      {currentPage < totalPages && (
        <Link href={createPageURL(currentPage + 1)} className="px-3 py-2 rounded border hover:bg-gray-100">
          Next
        </Link>
      )}
    </div>
  );
}