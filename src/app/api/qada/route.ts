// src/app/api/qada/route.ts
//
// GET /api/qada → ambil semua qada_entry untuk user yang login (terbaru dulu).
// Wajib session (401 untuk guest).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const qada = await db.qadaEntry.findMany({
    where: { userId: user.id },
    orderBy: { prayerDate: "desc" },
  });
  return NextResponse.json({ qada });
}
