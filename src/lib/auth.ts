// src/lib/auth.ts
//
// Konfigurasi NextAuth (Credentials — email + password, hash bcrypt).
// Strategi session: JWT (tanpa adapter Prisma).
//
// Helper `getSessionUser()` dipakai semua API route untuk mengambil user
// berdasarkan session, menggantikan pola DEMO_UID sebelumnya.

import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase() ?? "";
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        // Akun tanpa passwordHash (mis. legacy demo) tidak bisa login.
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          uid: user.uid,
          email: user.email,
          name: user.name,
          isOnboarded: user.isOnboarded,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.uid ?? user.email ?? "";
        token.isOnboarded = user.isOnboarded ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.uid = token.uid ?? "";
        session.user.isOnboarded = token.isOnboarded ?? false;
      }
      return session;
    },
  },
};

/**
 * Ambil user Prisma yang sedang login berdasarkan session.
 * Kembalikan `null` jika tidak ada session (guest / belum autentikasi).
 */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.uid;
  if (!uid) return null;
  return db.user.findUnique({ where: { uid } });
}

/** Serialisasi user untuk respons API (hindari bocor passwordHash). */
export function serializeUser(user: {
  id: string;
  uid: string;
  email: string | null;
  name: string | null;
  menarcheDate: Date | null;
  adatHaid: number;
  adatSuci: number;
  mustahadahCat: string;
  isOnboarded: boolean;
  isGuest: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    uid: user.uid,
    email: user.email,
    name: user.name,
    menarcheDate: user.menarcheDate,
    adatHaid: user.adatHaid,
    adatSuci: user.adatSuci,
    mustahadahCat: user.mustahadahCat,
    isOnboarded: user.isOnboarded,
    isGuest: user.isGuest,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
