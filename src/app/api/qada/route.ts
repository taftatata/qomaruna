// src/app/api/qada/route.ts
//
// GET /api/qada → ambil semua qada_entry untuk user demo (terbaru dulu).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const DEMO_UID = "demo-user-1";

export async function GET() {
  const user = await db.user.findUnique({ where: { uid: DEMO_UID } });
  if (!user) {
    return NextResponse.json({ qada: [] });
  }
  const qada = await db.qadaEntry.findMany({
    where: { userId: user.id },
    orderBy: { prayerDate: "desc" },
  });
  return NextResponse.json({ qada });
}
