// src/app/api/status/route.ts
//
// GET /api/status → status ibadah terkini (gabungan calculateHaidDuration +
// classifyMustahadah + qadaCalculator). Wajib session (401 untuk guest).
// Dipakai dashboard untuk inisial load.

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import {
  analyzeEpisode,
  toDomainBloodLog,
} from "@/lib/fiqh";
import { MUSTAHADAH_LABELS, MustahadahCategory } from "@/lib/fiqh/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  // Ambil 60 hari terakhir (window untuk analisis + tampilan kalender).
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const logs = await db.bloodLog.findMany({
    where: { userId: user.id, startTime: { gte: since } },
    orderBy: { startTime: "asc" },
  });
  const qada = await db.qadaEntry.findMany({ where: { userId: user.id } });

  const fiqhUser = {
    id: user.id,
    uid: user.uid,
    menarcheDate: user.menarcheDate,
    adatHaid: user.adatHaid,
    adatSuci: user.adatSuci,
    mustahadahCat: user.mustahadahCat as MustahadahCategory,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  const analysis = analyzeEpisode(
    fiqhUser,
    logs.map(toDomainBloodLog),
    qada.map((q) => ({
      id: q.id,
      userId: q.userId,
      prayerName: q.prayerName as never,
      prayerDate: q.prayerDate,
      reason: q.reason as never,
      isResolved: q.isResolved,
      createdAt: q.createdAt,
    })),
  );

  // Persistensi qada baru (idempotent — dedupe by prayerName+prayerDate+reason).
  for (const q of analysis.qadaToAdd) {
    const dup = qada.some(
      (e) =>
        e.prayerName === q.prayerName &&
        e.prayerDate.toDateString() === q.prayerDate.toDateString() &&
        e.reason === q.reason,
    );
    if (!dup) {
      await db.qadaEntry.create({
        data: {
          userId: user.id,
          prayerName: q.prayerName,
          prayerDate: q.prayerDate,
          reason: q.reason,
          isResolved: false,
        },
      });
    }
  }
  // Re-fetch qada supaya jumlah pending terbaru.
  const qadaRefreshed = await db.qadaEntry.findMany({
    where: { userId: user.id },
  });

  return NextResponse.json({
    status: analysis.status,
    reason: analysis.reason,
    mustahadahCategory: analysis.mustahadahCategory,
    mustahadahLabel: MUSTAHADAH_LABELS[analysis.mustahadahCategory],
    totalBleedingHours: analysis.totalBleedingHours,
    totalBleedingDays: analysis.totalBleedingDays,
    isExceedsMaxDays: analysis.isExceedsMaxDays,
    kapasVerified: analysis.kapasVerified,
    instructions: analysis.instructions,
    haidLogCount: analysis.haidLogs.length,
    istihadahLogCount: analysis.istihadahLogs.length,
    qadaPendingCount: qadaRefreshed.filter((q) => !q.isResolved).length,
    qadaTotalCount: qadaRefreshed.length,
  });
}
