// src/app/api/user/route.ts
//
// GET /api/user
//   - Ambil data user dari session (wajib login — 401 untuk guest).
//   - Mengembalikan `isOnboarded` flag (false = user baru, wajib onboarding).
//
// PATCH /api/user
//   - Update adatHaid (1-15), adatSuci (15-60), mustahadahCat, menarcheDate,
//     isOnboarded. Dipakai oleh onboarding flow & Profil screen.
//
// CATATAN: Semua data tersimpan lokal via Prisma+SQLite (substitusi Firestore).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, serializeUser } from "@/lib/auth";
import { MustahadahCategory } from "@/lib/fiqh/types";

export const dynamic = "force-dynamic";

// ──────────────────────────────────────────────────────────────────────────
// PATCH — update user fields (dipanggil dari onboarding & Profil)
// ──────────────────────────────────────────────────────────────────────────
export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const updated = await db.user.update({
    where: { uid: user.uid },
    data,
  });

  return NextResponse.json(serializeUser(updated));
}

// ──────────────────────────────────────────────────────────────────────────
// GET — ambil user berdasarkan session
// ──────────────────────────────────────────────────────────────────────────
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(serializeUser(user));
}
