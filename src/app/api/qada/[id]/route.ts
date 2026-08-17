// src/app/api/qada/[id]/route.ts
//
// PATCH /api/qada/[id] → toggle isResolved (atau set eksplisit via body).
// Wajib session (401 untuk guest) — hanya pemilik qada yang bisa mengubah.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let isResolved: boolean | undefined;
  try {
    const body = await req.json();
    if (typeof body?.isResolved === "boolean") isResolved = body.isResolved;
  } catch {
    /* no body — toggle */
  }

  const existing = await db.qadaEntry.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Qada tidak ditemukan." }, { status: 404 });
  }

  const updated = await db.qadaEntry.update({
    where: { id },
    data: { isResolved: isResolved ?? !existing.isResolved },
  });
  return NextResponse.json(updated);
}
