// src/types/next-auth.d.ts
//
// Type augmentation untuk NextAuth (v4) — menambahkan field `uid` dan
// `isOnboarded` ke Session.User & JWT, agar tersedia di seluruh aplikasi.

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      uid: string;
      email?: string | null;
      name?: string | null;
      isOnboarded?: boolean;
    };
  }

  interface User {
    uid?: string;
    isOnboarded?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    isOnboarded?: boolean;
  }
}
