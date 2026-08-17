// src/app/api/user/route.ts
//
// GET /api/user
//   - Upsert user demo (uid="demo-user-1").
//   - Returns `isOnboarded` flag (false = user baru, wajib lewati onboarding).
//   - Auto-seed 3 blood_logs DIHAPUS — user baru mulai dari state kosong
//     (SUCI default + CTA "Catat Darah Keluar").
//
// PATCH /api/user
//   - Update adatHaid (1-15), adatSuci (15-60), mustahadahCat, menarcheDate,
//     isOnboarded. Dipakai oleh onboarding flow & Profil screen.
//
// Catatan: substitusi Firestore — semua data tersimpan lokal via Prisma+SQLite.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MustahadahCategory } from "@/lib/fiqh/types";

export const dynamic = "force-dynamic";

const DEMO_UID = "demo-user-1";

// ──────────────────────────────────────────────────────────────────────────
// PATCH — update user fields (dipanggil dari onboarding & Profil)
// ──────────────────────────────────────────────────────────────────────────
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (
    typeof body.adatHaid === "number" &&
    body.adatHaid >= 1 &&
    body.adatHaid <= 15
  ) {
    data.adatHaid = body.adatHaid;
  }
  if (
    typeof body.adatSuci === "number" &&
    body.adatSuci >= 15 &&
    body.adatSuci <= 60
  ) {
    data.adatSuci = body.adatSuci;
  }
  if (
    typeof body.mustahadahCat === "string" &&
    Object.values(MustahadahCategory).includes(
      body.mustahadahCat as MustahadahCategory,
    )
  ) {
    data.mustahadahCat = body.mustahadahCat;
  }
  if (typeof body.menarcheDate === "string") {
    const d = new Date(body.menarcheDate);
    if (!Number.isNaN(d.getTime())) data.menarcheDate = d;
  } else if (body.menarcheDate === null) {
    data.menarcheDate = null;
  }
  if (typeof body.isOnboarded === "boolean") {
    data.isOnboarded = body.isOnboarded;
  }
  if (typeof body.isGuest === "boolean") {
    data.isGuest = body.isGuest;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Tidak ada field valid untuk diupdate" },
      { status: 400 },
    );
  }

  const user = await db.user.update({
    where: { uid: DEMO_UID },
    data,
  });

  return NextResponse.json({
    id: user.id,
    uid: user.uid,
    menarcheDate: user.menarcheDate,
    adatHaid: user.adatHaid,
    adatSuci: user.adatSuci,
    mustahadahCat: user.mustahadahCat,
    isOnboarded: user.isOnboarded,
    isGuest: user.isGuest,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
}

// ──────────────────────────────────────────────────────────────────────────
// GET — ambil/autocreate user demo
// ──────────────────────────────────────────────────────────────────────────
export async function GET() {
  // upsert user demo. isOnboarded default=false → user baru wajib onboarding.
  const user = await db.user.upsert({
    where: { uid: DEMO_UID },
    update: {},
    create: {
      uid: DEMO_UID,
      adatHaid: 6,
      adatSuci: 23,
      mustahadahCat: "MUBTADAAH_MUMAYYIZAH",
      isOnboarded: false,
      isGuest: true,
    },
  });

  // CATATAN: Auto-seed blood_logs DIHAPUS.
  // User baru yang selesai onboarding akan langsung melihat Dashboard kosong
  // (status SUCI default + CTA "Catat Darah Keluar") sesuai spec.
  // Demo data sebelumnya di-reset via scripts/reset-onboarding.ts.

  return NextResponse.json({
    id: user.id,
    uid: user.uid,
    menarcheDate: user.menarcheDate,
    adatHaid: user.adatHaid,
    adatSuci: user.adatSuci,
    mustahadahCat: user.mustahadahCat,
    isOnboarded: user.isOnboarded,
    isGuest: user.isGuest,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
}
