import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stock, demand, loyalty } = body;

    // Validasi tipe dan rentang
    if (
      typeof stock !== 'number' || stock < 0 || stock > 100 ||
      typeof demand !== 'number' || demand < 0 || demand > 100 ||
      typeof loyalty !== 'number' || loyalty < 0 || loyalty > 5
    ) {
      return NextResponse.json({ message: 'Input tidak valid' }, { status: 400 });
    }

    // --- Fungsi keanggotaan (contoh hardcode, bisa diambil dari DB) ---
    const muStockRendah = Math.max(0, Math.min(1, (40 - stock) / 40));
    const muStockSedang = Math.max(0, Math.min(1,
      stock <= 30 ? 0 :
      stock <= 70 ? (stock - 30) / 40 :
      (100 - stock) / 30
    ));
    const muStockTinggi = Math.max(0, Math.min(1, (stock - 60) / 40));

    const muDemandRendah = Math.max(0, Math.min(1, (40 - demand) / 40));
    const muDemandSedang = Math.max(0, Math.min(1,
      demand <= 30 ? 0 :
      demand <= 70 ? (demand - 30) / 40 :
      (100 - demand) / 30
    ));
    const muDemandTinggi = Math.max(0, Math.min(1, (demand - 60) / 40));

    const muLoyalRendah = Math.max(0, Math.min(1, (2 - loyalty) / 2));
    const muLoyalSedang = Math.max(0, Math.min(1,
      loyalty <= 2 ? 0 :
      loyalty <= 4 ? (loyalty - 2) / 2 :
      (5 - loyalty) / 1
    ));
    const muLoyalTinggi = Math.max(0, Math.min(1, (loyalty - 4) / 1));

    // --- Aturan fuzzy (contoh dari skripsi) ---
    const r1 = Math.min(muStockTinggi, muDemandRendah, muLoyalTinggi); // diskon besar
    const r2 = Math.min(muStockSedang, muDemandRendah);                // diskon sedang
    const r3 = Math.min(muStockRendah, muDemandTinggi);                // diskon kecil

    // Defuzzifikasi dengan metode centroid sederhana (titik tengah)
    const outputBesar = r1 * 25; // 20-30% → tengah 25%
    const outputSedang = r2 * 15; // 10-20% → tengah 15%
    const outputKecil = r3 * 5;   // 0-10% → tengah 5%

    const totalWeight = r1 + r2 + r3;
    let discount = totalWeight > 0
      ? (outputBesar + outputSedang + outputKecil) / totalWeight
      : 10; // fallback

    discount = Math.round(discount * 100) / 100; // 2 desimal

    // Simpan ke database
    const result = await prisma.discountResult.create({
      data: {
        inputValues: { stock, demand, loyalty },
        calculatedDiscount: discount,
      },
    });

    return NextResponse.json({
      calculatedDiscount: discount,
      inputValues: { stock, demand, loyalty },
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}