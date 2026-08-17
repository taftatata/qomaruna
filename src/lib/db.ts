import { PrismaClient } from '@prisma/client'
import type { D1Database } from '@cloudflare/workers-types'

declare global {
  interface CloudflareEnv {
    DB?: D1Database
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Inisialisasi Prisma Client secara asinkron.
 *
 * Di produksi (Cloudflare Pages/Workers) database memakai binding D1 via
 * driver adapter Prisma. Binding D1 hanya tersedia saat runtime Worker, jadi
 * `getCloudflareContext({ async: true })` dipanggil di dalam fungsi (bukan di
 * top-level) untuk menghindari error static analysis saat build. Adapter &
 * Cloudflare context di-import secara dinamis agar tidak mengevaluasi binding
 * saat proses build.
 *
 * Untuk dev lokal (`DATABASE_KIND !== 'd1'`) tetap pakai PrismaClient SQLite
 * biasa dengan singleton global agar tidak ada koneksi berlebih.
 */
async function createClient(): Promise<PrismaClient> {
  if (process.env.DATABASE_KIND === 'd1') {
    const [{ PrismaD1 }, { getCloudflareContext }] = await Promise.all([
      import('@prisma/adapter-d1'),
      import('@opennextjs/cloudflare'),
    ])
    const { env } = await getCloudflareContext({ async: true })
    const adapter = new PrismaD1(env.DB!)
    return new PrismaClient({ adapter })
  }
  return new PrismaClient({
    log: ['query'],
  })
}

/**
 * Ambil Prisma Client yang siap dipakai. Panggil di dalam handler/route
 * (API Routes, Server Actions, callback NextAuth) — bukan di top-level modul.
 */
export async function getDb(): Promise<PrismaClient> {
  // Dev lokal: singleton supaya tidak membuka koneksi berlebih.
  if (process.env.DATABASE_KIND !== 'd1') {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = await createClient()
    }
    return globalForPrisma.prisma
  }
  // Produksi (runtime Edge Cloudflare): buat client per-request karena
  // `getCloudflareContext` terikat ke request yang sedang berjalan.
  return createClient()
}
