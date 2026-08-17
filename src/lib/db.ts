import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Di produksi (Cloudflare Pages/Workers) database memakai binding D1 via
 * driver adapter Prisma. Binding D1 hanya tersedia saat runtime Worker, jadi
 * instantiasi adapter dijaga oleh variabel `DATABASE_KIND=d1` (didefinisikan
 * di wrangler.jsonc). Untuk dev lokal tetap pakai PrismaClient SQLite biasa.
 */
function createClient(): PrismaClient {
  if (process.env.DATABASE_KIND === 'd1') {
    const { PrismaD1 } = require('@prisma/adapter-d1') as typeof import('@prisma/adapter-d1')
    const { getCloudflareContext } = require('@opennextjs/cloudflare') as typeof import('@opennextjs/cloudflare')
    const adapter = new PrismaD1(getCloudflareContext().env.DB)
    return new PrismaClient({ adapter })
  }
  return new PrismaClient({
    log: ['query'],
  })
}

export const db = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db