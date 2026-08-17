// src/app/api/blood-logs/route.ts
//
// GET  /api/blood-logs?days=60   → ambil blood_logs N hari terakhir (terbaru dulu)
// POST /api/blood-logs            → simpan blood_log baru + trigger qada calc server-side
//
// Kedua endpoint wajib session (401 untuk guest). Data scoped ke user session.
// Substitusi Firestore: data tersimpan lokal via Prisma+SQLite.

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import {
  analyzeEpisode,
  toDomainBloodLog,
} from "@/lib/fiqh";
import {
  ColorWeight,
  TraitWeight,
  MustahadahCategory,
} from "@/lib/fiqh/types";
import { COLOR_BY_WEIGHT, TRAIT_BY_WEIGHT } from "@/lib/fiqh/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const daysParam = req.nextUrl.searchParams.get("days") ?? "60";
  const days = Math.min(Math.max(parseInt(daysParam, 10) || 60, 1), 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const logs = await db.bloodLog.findMany({
    where: {
      userId: user.id,
      startTime: { gte: since },
    },
    orderBy: { startTime: "desc" },
  });

  return NextResponse.json({ logs });
}

interface PostBody {
  startTime: string;
  endTime?: string | null;
  colorWeight: number;
  colorLabel?: string;
  traitWeight: number;
  traitLabel?: string;
  isKapasPutih?: boolean;
  note?: string | null;
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  let body: PostBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body request bukan JSON valid." },
      { status: 400 },
    );
  }

  // Validasi minimal
  const startTimeMs = Date.parse(body.startTime);
  if (!body.startTime || isNaN(startTimeMs)) {
    return NextResponse.json(
      { error: "startTime wajib & harus ISO string." },
      { status: 400 },
    );
  }
  const cw = Number(body.colorWeight);
  const tw = Number(body.traitWeight);
  if (!COLOR_BY_WEIGHT[cw]) {
    return NextResponse.json(
      { error: "colorWeight harus 1..5." },
      { status: 400 },
    );
  }
  if (!TRAIT_BY_WEIGHT[tw]) {
    return NextResponse.json(
      { error: "traitWeight harus 1..4." },
      { status: 400 },
    );
  }

  let endTime: Date | null = null;
  if (body.endTime) {
    const e = Date.parse(body.endTime);
    if (!isNaN(e)) endTime = new Date(e);
  }

  // Jika isKapasPutih=true, kapas terverifikasi bersih → secara fikih
  // pendarahan dianggap berakhir. Tutup semua BloodLog yang masih endTime=null
  // (untuk user ini) dengan timestamp sekarang, supaya analisis bisa
  // mencapai status SUCI.
  if (body.isKapasPutih) {
    await db.bloodLog.updateMany({
      where: { userId: user.id, endTime: null },
      data: { endTime: new Date() },
    });
  }

  const created = await db.bloodLog.create({
    data: {
      userId: user.id,
      startTime: new Date(startTimeMs),
      endTime,
      colorWeight: cw,
      colorLabel: COLOR_BY_WEIGHT[cw].label,
      traitWeight: tw,
      traitLabel: TRAIT_BY_WEIGHT[tw].label,
      isKapasPutih: !!body.isKapasPutih,
      note: body.note ?? null,
    },
  });

  // Setelah simpan, jalankan analisis penuh untuk menentukan qada baru.
  const allLogs = await db.bloodLog.findMany({
    where: { userId: user.id },
    orderBy: { startTime: "asc" },
  });
  const existingQada = await db.qadaEntry.findMany({
    where: { userId: user.id },
  });

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
    allLogs.map(toDomainBloodLog),
    existingQada.map((q) => ({
      id: q.id,
      userId: q.userId,
      prayerName: q.prayerName as never,
      prayerDate: q.prayerDate,
      reason: q.reason as never,
      isResolved: q.isResolved,
      createdAt: q.createdAt,
    })),
  );

  // Sisipkan qada baru (dedupe by prayerName+prayerDate+reason).
  const newQadaEntries: {
    id: string;
    userId: string;
    prayerName: string;
    prayerDate: Date;
    reason: string;
    isResolved: boolean;
    createdAt: Date;
  }[] = [];
  for (const q of analysis.qadaToAdd) {
    const dup = existingQada.some(
      (e) =>
        e.prayerName === q.prayerName &&
        e.prayerDate.toDateString() === q.prayerDate.toDateString() &&
        e.reason === q.reason,
    );
    if (dup) continue;
    const created2 = await db.qadaEntry.create({
      data: {
        userId: user.id,
        prayerName: q.prayerName,
        prayerDate: q.prayerDate,
        reason: q.reason,
        isResolved: false,
      },
    });
    newQadaEntries.push(created2);
  }

  return NextResponse.json({
    log: created,
    newQadaEntries,
    analysis: {
      status: analysis.status,
      reason: analysis.reason,
      instructions: analysis.instructions,
    },
  });
}
