const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

const prisma = new PrismaClient()

// ==================== FUNGSI FUZZY LOGIC ====================
function calculateDiscount(stock, demand, loyalty) {
  // Clamp nilai ke rentang yang diharapkan
  stock = Math.min(100, Math.max(0, stock))
  demand = Math.min(100, Math.max(0, demand))
  loyalty = Math.min(5, Math.max(0, loyalty))

  // FUZZIFIKASI STOK
  const muStockRendah = Math.max(0, Math.min(1, (40 - stock) / 40))
  let muStockSedang
  if (stock <= 30) muStockSedang = 0
  else if (stock <= 70) muStockSedang = (stock - 30) / 40
  else muStockSedang = (100 - stock) / 30
  muStockSedang = Math.max(0, Math.min(1, muStockSedang))

  const muStockTinggi = Math.max(0, Math.min(1, (stock - 60) / 40))

  // FUZZIFIKASI PERMINTAAN
  const muDemandRendah = Math.max(0, Math.min(1, (40 - demand) / 40))
  let muDemandSedang
  if (demand <= 30) muDemandSedang = 0
  else if (demand <= 70) muDemandSedang = (demand - 30) / 40
  else muDemandSedang = (100 - demand) / 30
  muDemandSedang = Math.max(0, Math.min(1, muDemandSedang))

  const muDemandTinggi = Math.max(0, Math.min(1, (demand - 60) / 40))

  // FUZZIFIKASI LOYALITAS
  const muLoyalRendah = Math.max(0, Math.min(1, (2 - loyalty) / 2))
  let muLoyalSedang
  if (loyalty <= 2) muLoyalSedang = 0
  else if (loyalty <= 4) muLoyalSedang = (loyalty - 2) / 2
  else muLoyalSedang = (5 - loyalty) / 1
  muLoyalSedang = Math.max(0, Math.min(1, muLoyalSedang))

  const muLoyalTinggi = Math.max(0, Math.min(1, (loyalty - 4) / 1))

  // ATURAN FUZZY
  const r1 = Math.min(muStockTinggi, muDemandRendah, muLoyalTinggi) // diskon besar
  const r2 = Math.min(muStockSedang, muDemandRendah)                // diskon sedang
  const r3 = Math.min(muStockRendah, muDemandTinggi)                // diskon kecil

  // DEFUZZIFIKASI (centroid sederhana)
  const outputBesar = r1 * 25 // titik tengah 20-30% -> 25%
  const outputSedang = r2 * 15 // 10-20% -> 15%
  const outputKecil = r3 * 5   // 0-10% -> 5%

  const totalWeight = r1 + r2 + r3
  let discount = totalWeight > 0
    ? (outputBesar + outputSedang + outputKecil) / totalWeight
    : 10 // fallback jika tidak ada aturan aktif

  return Math.round(discount * 100) / 100 // bulatkan 2 desimal
}

// ==================== MAIN ====================
async function main() {
  const results = []
  const csvFilePath = path.join(__dirname, 'SYNTHETIC Markdown Dataset.csv')

  console.log('🚀 Membaca file CSV...')
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`📊 Total baris CSV: ${results.length}`)

  // Hitung nilai maksimum Historical_Sales untuk normalisasi permintaan
  let maxHistorical = 0
  results.forEach(row => {
    const hist = parseFloat(row.Historical_Sales)
    if (!isNaN(hist) && hist > maxHistorical) maxHistorical = hist
  })
  console.log(`📈 Nilai maksimum Historical_Sales: ${maxHistorical}`)

  // OPSIONAL: Hapus semua data lama jika ingin memulai dari database kosong
  // (Hati-hati, akan menghapus semua data!)
  // console.log('🗑️  Menghapus semua data lama...')
  // await prisma.$executeRaw`PRAGMA foreign_keys = OFF;` // untuk SQLite
  // await prisma.discountResult.deleteMany()
  // await prisma.salesHistory.deleteMany()
  // await prisma.promotion.deleteMany()
  // await prisma.productMetric.deleteMany()
  // await prisma.product.deleteMany()
  // await prisma.$executeRaw`PRAGMA foreign_keys = ON;`

  let successCount = 0
  let errorCount = 0

  for (const [index, row] of results.entries()) {
    try {
      // Validasi data wajib
      const productId = parseInt(row.Product_ID)
      if (isNaN(productId)) throw new Error('Product_ID tidak valid')

      const name = row.Product_Name
      if (!name) throw new Error('Product_Name kosong')

      const originalPrice = parseFloat(row.Original_Price)
      if (isNaN(originalPrice) || originalPrice <= 0) throw new Error('Original_Price tidak valid')

      const stockLevel = parseInt(row.Stock_Level)
      if (isNaN(stockLevel) || stockLevel < 0) throw new Error('Stock_Level tidak valid')

      const historicalSales = parseFloat(row.Historical_Sales)
      if (isNaN(historicalSales) || historicalSales < 0) throw new Error('Historical_Sales tidak valid')

      // Data opsional
      const category = row.Category || null
      const brand = row.Brand || null
      const season = row.Season || null
      const competitorPrice = row.Competitor_Price ? parseFloat(row.Competitor_Price) : null
      const optimalDiscount = row['Optimal Discount'] ? parseFloat(row['Optimal Discount']) : null
      const customerRatings = row['Customer Ratings'] ? parseFloat(row['Customer Ratings']) : null
      const returnRate = row['Return Rate'] ? parseFloat(row['Return Rate']) : null
      const seasonalityFactor = row.Seasonality_Factor ? parseFloat(row.Seasonality_Factor) : null

      // Upsert produk (buat jika belum ada, update jika sudah)
      const product = await prisma.product.upsert({
        where: { productId },
        update: {
          name,
          category,
          brand,
          season,
          originalPrice,
          competitorPrice,
          optimalDiscount,
        },
        create: {
          productId,
          name,
          category,
          brand,
          season,
          originalPrice,
          competitorPrice,
          optimalDiscount,
        },
      })

      // Hapus data terkait yang lama untuk produk ini (agar tidak duplikat)
      await prisma.$transaction([
        prisma.discountResult.deleteMany({ where: { productId: product.id } }),
        prisma.salesHistory.deleteMany({ where: { productId: product.id } }),
        prisma.promotion.deleteMany({ where: { productId: product.id } }),
        prisma.productMetric.deleteMany({ where: { productId: product.id } }),
      ])

      // Buat metrik produk baru
      await prisma.productMetric.create({
        data: {
          productId: product.id,
          stockLevel,
          customerRatings,
          returnRate,
          seasonalityFactor,
        },
      })

      // Historical sales
      await prisma.salesHistory.create({
        data: {
          productId: product.id,
          salesAmount: historicalSales,
          stage: 'historical',
        },
      })

      // Proses markdown untuk 4 level
      for (let i = 1; i <= 4; i++) {
        const markdownKey = `Markdown_${i}`
        const salesAfterKey = `Sales_After_M${i}`

        if (row[markdownKey] && row[salesAfterKey] && row[markdownKey].trim() !== '' && row[salesAfterKey].trim() !== '') {
          const markdownValue = parseFloat(row[markdownKey])
          const salesAfter = parseFloat(row[salesAfterKey])

          if (!isNaN(markdownValue) && !isNaN(salesAfter)) {
            const promotion = await prisma.promotion.create({
              data: {
                productId: product.id,
                markdownValue,
                promotionType: row.Promotion_Type || null,
                markdownLevel: i,
              },
            })

            await prisma.salesHistory.create({
              data: {
                productId: product.id,
                promotionId: promotion.id,
                salesAmount: salesAfter,
                stage: `after_m${i}`,
              },
            })
          }
        }
      }

      // ===== HITUNG DISKON FUZZY =====
      // Normalisasi permintaan dari Historical_Sales
      let demand = 50 // default
      if (!isNaN(historicalSales) && maxHistorical > 0) {
        demand = (historicalSales / maxHistorical) * 100
        demand = Math.min(100, Math.max(0, demand))
      }

      // Loyalitas dari Customer Ratings (jika ada)
      const loyalty = (customerRatings !== null && !isNaN(customerRatings)) ? customerRatings : 2.5

      const calculatedDiscount = calculateDiscount(stockLevel, demand, loyalty)

      // Simpan hasil ke DiscountResult
      await prisma.discountResult.create({
        data: {
          productId: product.id,
          inputValues: {
            stock: stockLevel,
            demand: Math.round(demand * 100) / 100, // simpan dengan 2 desimal
            loyalty,
          },
          calculatedDiscount, // field wajib
          timestamp: new Date(),
        },
      })

      successCount++
      if ((index + 1) % 100 === 0) {
        console.log(`✅ ${index + 1} baris telah diproses... (sukses: ${successCount}, gagal: ${errorCount})`)
      }
    } catch (err) {
      console.error(`❌ Gagal memproses baris ke-${index + 1}:`, err.message)
      errorCount++
      // Opsional: hentikan proses jika ada error kritis (misal duplikat productId)
      // if (err.code === 'P2002') process.exit(1)
    }
  }

  console.log('\n🎉 Seeding selesai!')
  console.log(`   Total sukses : ${successCount} baris`)
  console.log(`   Total gagal  : ${errorCount} baris`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('❌ Fatal error:', e)
  process.exit(1)
})