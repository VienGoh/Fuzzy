// app/api/visualization/route.ts
import { NextResponse } from 'next/server'

// Data uji dari Tabel 3.3 skripsi
const testData = [
  { name: 'Sampel 1', sistem: 15, aktual: 18 },
  { name: 'Sampel 2', sistem: 12, aktual: 10 },
  { name: 'Sampel 3', sistem: 20, aktual: 22 },
  { name: 'Sampel 4', sistem: 10, aktual: 15 },
  { name: 'Sampel 5', sistem: 14, aktual: 13 },
  { name: 'Sampel 6', sistem: 18, aktual: 20 },
  { name: 'Sampel 7', sistem: 11, aktual: 14 },
  { name: 'Sampel 8', sistem: 16, aktual: 18 },
  { name: 'Sampel 9', sistem: 13, aktual: 12 },
  { name: 'Sampel 10', sistem: 17, aktual: 19 }
]

export async function GET() {
  return NextResponse.json(testData)
}