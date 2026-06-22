// src/app/api/qada/[id]/route.ts
//
// PATCH /api/qada/[id] → toggle isResolved (atau set eksplisit via body).

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let isResolved: boolean | undefined;
  try {
    const body = await req.json();
    if (typeof body?.isResolved === "boolean") isResolved = body.isResolved;
  } catch {
    /* no body — toggle */
  }

  const existing = await db.qadaEntry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Qada tidak ditemukan." }, { status: 404 });
  }

  const updated = await db.qadaEntry.update({
    where: { id },
    data: { isResolved: isResolved ?? !existing.isResolved },
  });
  return NextResponse.json(updated);
}
