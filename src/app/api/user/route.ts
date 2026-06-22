// src/app/api/user/route.ts
//
// GET /api/user
//   - Mengembalikan user demo (uid="demo-user-1"), auto-create bila belum ada.
//   - Auto-seed 2-3 sample blood_logs bila user baru dibuat (dashboard langsung
//     memiliki data).
//
// Catatan: substitusi Firestore — semua data tersimpan lokal via Prisma+SQLite.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ColorWeight, TraitWeight } from "@/lib/fiqh/types";

export const dynamic = "force-dynamic";

const DEMO_UID = "demo-user-1";

export async function GET() {
  // upsert untuk menghindari race condition saat beberapa request paralel
  // mencoba create user demo sekaligus.
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

  // Auto-seed 2-3 sample blood_logs bila user baru (belum punya log).
  const existingLogs = await db.bloodLog.count({
    where: { userId: user.id },
  });
  if (existingLogs === 0) {
    // Skenario awal haid yang valid (≥ 24 jam akumulatif dalam 15 hari):
    //   Log 1: 2 hari lalu 12:30 (di window Zuhur 12:00-15:15, sisa ≥ 5 menit)
    //          → triggers qada Zuhur. Berakhir tengah malam (11.5 jam).
    //   Log 2: kemarin 00:00 → hari ini 00:00 (24 jam penuh).
    //   Log 3: hari ini 00:00 → masih berlangsung.
    // Total: 11.5 + 24 + partial > 35 jam, 3 hari (≤ 15) → HAID (HARAM_IBADAH).
    const now = new Date();
    const start1 = new Date(now);
    start1.setDate(start1.getDate() - 2);
    start1.setHours(12, 30, 0, 0); // 2 hari lalu 12:30 → qada Zuhur
    const end1 = new Date(now);
    end1.setDate(end1.getDate() - 1);
    end1.setHours(0, 0, 0, 0); // kemarin 00:00

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
    start2.setHours(0, 0, 0, 0); // kemarin 00:00
    const end2 = new Date(now);
    end2.setHours(0, 0, 0, 0); // hari ini 00:00
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
    start3.setHours(0, 0, 0, 0); // hari ini 00:00
    await db.bloodLog.create({
      data: {
        userId: user.id,
        startTime: start3,
        endTime: null, // masih berlangsung
        colorWeight: ColorWeight.COKELAT,
        colorLabel: "Cokelat",
        traitWeight: TraitWeight.KENTAL,
        traitLabel: "Kental",
        isKapasPutih: false,
        note: "Hari ketiga — pendarahan masih berlangsung, warna mulai cokelat.",
      },
    });
  }

  return NextResponse.json({
    id: user.id,
    uid: user.uid,
    menarcheDate: user.menarcheDate,
    adatHaid: user.adatHaid,
    adatSuci: user.adatSuci,
    mustahadahCat: user.mustahadahCat,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
}
