// src/app/api/status/route.ts
//
// GET /api/status → status ibadah terkini (gabungan calculateHaidDuration +
// classifyMustahadah + qadaCalculator). Dipakai dashboard untuk inisial load.
//
// Self-sufficient: upsert user demo + seed blood_logs jika belum ada, supaya
// /api/status tidak bergantung pada /api/user dipanggil lebih dulu (dashboard
// memanggil ketiga endpoint secara paralel).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  analyzeEpisode,
  toDomainBloodLog,
} from "@/lib/fiqh";
import {
  MustahadahCategory,
  MUSTAHADAH_LABELS,
  ColorWeight,
  TraitWeight,
} from "@/lib/fiqh/types";

export const dynamic = "force-dynamic";

const DEMO_UID = "demo-user-1";

async function ensureUserSeeded() {
  const user = await db.user.upsert({
    where: { uid: DEMO_UID },
    update: {},
    create: {
      uid: DEMO_UID,
      adatHaid: 6,
      adatSuci: 23,
      mustahadahCat: "MUBTADAAH_MUMAYYIZAH",
    },
  });

  const existingLogs = await db.bloodLog.count({
    where: { userId: user.id },
  });
  if (existingLogs === 0) {
    const now = new Date();
    const start1 = new Date(now);
    start1.setDate(start1.getDate() - 2);
    start1.setHours(12, 30, 0, 0);
    const end1 = new Date(now);
    end1.setDate(end1.getDate() - 1);
    end1.setHours(0, 0, 0, 0);
    await db.bloodLog.create({
      data: {
        userId: user.id,
        startTime: start1,
        endTime: end1,
        colorWeight: ColorWeight.MERAH,
        colorLabel: "Merah",
        traitWeight: TraitWeight.KENTAL_BERBAU,
        traitLabel: "Kental & Berbau",
        isKapasPutih: false,
        note: "Awal haid — 2 hari lalu siang, setelah Zuhur.",
      },
    });
    const start2 = new Date(now);
    start2.setDate(start2.getDate() - 1);
    start2.setHours(0, 0, 0, 0);
    const end2 = new Date(now);
    end2.setHours(0, 0, 0, 0);
    await db.bloodLog.create({
      data: {
        userId: user.id,
        startTime: start2,
        endTime: end2,
        colorWeight: ColorWeight.HITAM,
        colorLabel: "Hitam",
        traitWeight: TraitWeight.KENTAL_BERBAU,
        traitLabel: "Kental & Berbau",
        isKapasPutih: false,
        note: "Hari kedua haid — darah hitam pekat.",
      },
    });
    const start3 = new Date(now);
    start3.setHours(0, 0, 0, 0);
    await db.bloodLog.create({
      data: {
        userId: user.id,
        startTime: start3,
        endTime: null,
        colorWeight: ColorWeight.COKELAT,
        colorLabel: "Cokelat",
        traitWeight: TraitWeight.KENTAL,
        traitLabel: "Kental",
        isKapasPutih: false,
        note: "Hari ketiga — pendarahan masih berlangsung.",
      },
    });
  }
  return user;
}

export async function GET() {
  const user = await ensureUserSeeded();

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
