const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

const prisma = new PrismaClient()

async function main() {
  const results = []

  // Baca file CSV (pastikan file berada di folder yang sama dengan seed.cjs)
  // Jika file CSV diletakkan di root proyek, sesuaikan path-nya.
  const csvFilePath = path.join(__dirname, 'SYNTHETIC Markdown Dataset.csv')

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      console.log(`📊 Membaca ${results.length} baris data dari CSV...`)

      for (const [index, row] of results.entries()) {
        try {
          // Buat produk
          const product = await prisma.product.create({
            data: {
              productId: parseInt(row.Product_ID),
              name: row.Product_Name,
              category: row.Category || null,
              brand: row.Brand || null,
              season: row.Season || null,
              originalPrice: parseFloat(row.Original_Price),
              competitorPrice: row.Competitor_Price ? parseFloat(row.Competitor_Price) : null,
              optimalDiscount: row['Optimal Discount'] ? parseFloat(row['Optimal Discount']) : null,
            },
          })

          // Buat metrik produk
          await prisma.productMetric.create({
            data: {
              productId: product.id,
              stockLevel: parseInt(row.Stock_Level),
              customerRatings: row['Customer Ratings'] ? parseFloat(row['Customer Ratings']) : null,
              returnRate: row['Return Rate'] ? parseFloat(row['Return Rate']) : null,
              seasonalityFactor: row.Seasonality_Factor ? parseFloat(row.Seasonality_Factor) : null,
            },
          })

          // Historical sales
          await prisma.salesHistory.create({
            data: {
              productId: product.id,
              salesAmount: parseFloat(row.Historical_Sales),
              stage: 'historical',
            },
          })

          // Loop untuk 4 level markdown
          for (let i = 1; i <= 4; i++) {
            const markdownKey = `Markdown_${i}`
            const salesAfterKey = `Sales_After_M${i}`

            // Hanya buat jika nilai markdown dan sales after ada dan tidak kosong
            if (row[markdownKey] && row[salesAfterKey] && row[markdownKey].trim() !== '' && row[salesAfterKey].trim() !== '') {
              // Buat promotion
              const promotion = await prisma.promotion.create({
                data: {
                  productId: product.id,
                  markdownValue: parseFloat(row[markdownKey]),
                  promotionType: row.Promotion_Type || null,
                  markdownLevel: i,
                },
              })

              // Buat sales after markdown
              await prisma.salesHistory.create({
                data: {
                  productId: product.id,
                  promotionId: promotion.id,
                  salesAmount: parseFloat(row[salesAfterKey]),
                  stage: `after_m${i}`,
                },
              })
            }
          }

          if ((index + 1) % 100 === 0) {
            console.log(`✅ ${index + 1} baris telah diproses...`)
          }
        } catch (err) {
          console.error(`❌ Gagal memproses baris ke-${index + 1}:`, err.message)
          // Opsional: hentikan proses jika ada error
          // process.exit(1)
        }
      }

      console.log('🎉 Seeding selesai! Semua data berhasil dimasukkan.')
      await prisma.$disconnect()
    })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})