import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ===== UTILITIES =====
const clamp = (val: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, val));

// ===== MEMBERSHIP FUNCTIONS =====

/**
 * Fungsi keanggotaan Segitiga (Triangular)
 * @param x Nilai input
 * @param a Batas kiri
 * @param b Puncak (nilai keanggotaan = 1)
 * @param c Batas kanan
 */
const triangular = (x: number, a: number, b: number, c: number) => {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x < b) return (x - a) / (b - a);
  return (c - x) / (c - b);
};

/**
 * Fungsi keanggotaan Trapesium (Trapezoidal) - FIXED
 * @param x Nilai input
 * @param a Batas kiri bawah
 * @param b Batas kiri atas
 * @param c Batas kanan atas
 * @param d Batas kanan bawah
 */
const trapezoidal = (x: number, a: number, b: number, c: number, d: number) => {
  // ✅ FIX: Gunakan < dan > agar nilai tepat di batas (a atau d) masih bernilai 0, 
  // tapi nilai di dalam range [a,d] tetap terproses.
  // Sebelumnya: if (x <= a || x >= d) return 0; ❌ (menyebabkan x=5 return 0)
  if (x < a || x > d) return 0;
  
  if (x >= b && x <= c) return 1;
  if (x < b) {
    // Cegah pembagian dengan nol jika a === b
    const denominator = (b - a);
    return denominator === 0 ? 1 : (x - a) / denominator;
  }
  // Cegah pembagian dengan nol jika d === c
  const denominator = (d - c);
  return denominator === 0 ? 1 : (d - x) / denominator;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stock, demand, loyalty } = body;

    // ===== VALIDASI INPUT =====
    if (stock == null || demand == null || loyalty == null) {
      return NextResponse.json({ message: 'Semua input wajib diisi' }, { status: 400 });
    }

    const s = clamp(Number(stock), 0, 200);
    const d = clamp(Number(demand), 0, 500);
    const l = clamp(Number(loyalty), 0, 5);

    if ([s, d, l].some(isNaN)) {
      return NextResponse.json({ message: 'Input harus angka' }, { status: 400 });
    }

    // ===== FUZZIFICATION =====

    // 1. STOCK (Range: 0-200)
    const muS_Rendah = trapezoidal(s, 0, 0, 50, 100);
    const muS_Sedang = triangular(s, 50, 100, 150);
    const muS_Tinggi = trapezoidal(s, 100, 150, 200, 200);

    // 2. DEMAND (Range: 0-500)
    const muD_Rendah = trapezoidal(d, 0, 0, 125, 250);
    const muD_Sedang = triangular(d, 125, 250, 375);
    const muD_Tinggi = trapezoidal(d, 250, 375, 500, 500);

    // 3. LOYALTY (Range: 0-5)
    const muL_Rendah = trapezoidal(l, 0, 0, 1.5, 2.5);
    const muL_Sedang = triangular(l, 1.5, 2.5, 3.5);
    const muL_Tinggi = trapezoidal(l, 2.5, 3.5, 5, 5);

    // ===== RULE BASE =====
    type Rule = {
      conditions: number[];
      output: number;
      weight?: number;
    };

    const rules: Rule[] = [
      // --- BESAR ---
      { conditions: [muS_Tinggi, muD_Rendah, muL_Tinggi], output: 32, weight: 1.2 },
      { conditions: [muS_Tinggi, muD_Rendah, muL_Sedang], output: 30, weight: 1.1 },
      { conditions: [muS_Tinggi, muD_Sedang, muL_Tinggi], output: 28, weight: 1.0 },
      { conditions: [muS_Sedang, muD_Rendah, muL_Tinggi], output: 27, weight: 1.0 },

      // --- SEDANG ---
      { conditions: [muS_Sedang, muD_Sedang, muL_Sedang], output: 20 },
      { conditions: [muS_Tinggi, muD_Sedang, muL_Sedang], output: 22 },
      { conditions: [muS_Sedang, muD_Rendah, muL_Rendah], output: 18 },
      { conditions: [muS_Rendah, muD_Sedang, muL_Tinggi], output: 19 },
      { conditions: [muS_Sedang, muD_Tinggi, muL_Sedang], output: 17 },

      // --- KECIL ---
      { conditions: [muS_Rendah, muD_Tinggi, muL_Rendah], output: 8 },
      { conditions: [muS_Rendah, muD_Sedang, muL_Rendah], output: 10 },
      { conditions: [muS_Sedang, muD_Tinggi, muL_Rendah], output: 12 },
      { conditions: [muS_Rendah, muD_Rendah, muL_Sedang], output: 14 },
      { conditions: [muS_Tinggi, muD_Tinggi, muL_Rendah], output: 11 },
    ];

    // ===== INFERENCE (PRODUCT) =====
    let weightedSum = 0;
    let totalFiring = 0;

    for (const rule of rules) {
      // Hitung firing strength dengan metode Product (AND = perkalian)
      const firing = rule.conditions.reduce((acc, val) => acc * val, 1);
      const w = rule.weight ?? 1;

      weightedSum += firing * w * rule.output;
      totalFiring += firing * w;
    }

    // ===== DEFUZZIFIKASI (Centroid/Weighted Average) =====
    let discount: number;
    
    if (totalFiring > 0) {
      discount = weightedSum / totalFiring;
    } else {
      // Fallback jika tidak ada rule yang aktif (misal karena input di luar range)
      console.warn('Tidak ada rule yang aktif (totalFiring = 0), menggunakan default discount 15');
      discount = 15;
    }

    // ===== CLAMP FINAL OUTPUT =====
    // Batasi hasil akhir antara 5% s.d. 35%
    discount = clamp(discount, 5, 35);
    
    // Bulatkan ke 2 desimal
    discount = Math.round(discount * 100) / 100;

    // ===== SIMPAN KE DATABASE =====
    const result = await prisma.discountResult.create({
      data: {
        inputValues: { stock: s, demand: d, loyalty: l },
        calculatedDiscount: discount,
      },
    });

    return NextResponse.json({
      success: true,
      calculatedDiscount: discount,
      inputValues: { stock: s, demand: d, loyalty: l },
      debug: {
        membership: {
          stock: { rendah: muS_Rendah, sedang: muS_Sedang, tinggi: muS_Tinggi },
          demand: { rendah: muD_Rendah, sedang: muD_Sedang, tinggi: muD_Tinggi },
          loyalty: { rendah: muL_Rendah, sedang: muL_Sedang, tinggi: muL_Tinggi },
        },
        totalFiringStrength: totalFiring
      },
      timestamp: result.timestamp,
    });

  } catch (error) {
    console.error('Error processing fuzzy logic:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}