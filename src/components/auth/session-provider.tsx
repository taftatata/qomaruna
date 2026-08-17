"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

/**
 * Client wrapper — memungkinkan `useSession()` dipakai di seluruh komponen
 * aplikasi (next-auth/react butuh context dalam client boundary).
 */
export function AuthSessionProvider({
  children,
  session,
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
