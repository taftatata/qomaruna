// src/app/api/auth/register/route.ts
//
// POST /api/auth/register — daftar akun baru (email + password).
//  - email unik, password ≥ 6 karakter, di-hash dengan bcrypt (cost 10).
//  - `uid` diset = email (identifier konsisten untuk query & LogicEngine).
//  - `isOnboarded=false` → user baru diarahkan ke Onboarding Adat setelah
//    login (sesuai spec "Data Sync After Login").
//  - Client lalu memanggil signIn("credentials") untuk membuat session.

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password minimal 6 karakter." },
      { status: 400 },
    );
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email sudah terdaftar. Silakan masuk." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      uid: email,
      email,
      name,
      passwordHash,
      isGuest: false,
      isOnboarded: false,
      // Default Adat mengikuti spec Guest Mode (7/23) hingga user
      // menyelesaikan Onboarding yang menimpa nilai ini.
      adatHaid: 7,
      adatSuci: 23,
    },
  });

  return NextResponse.json({
    id: user.id,
    uid: user.uid,
    email: user.email,
    isOnboarded: user.isOnboarded,
  });
}
