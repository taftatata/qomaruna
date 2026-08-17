// src/app/api/auth/[...nextauth]/route.ts
//
// Route handler NextAuth — GET/POST untuk seluruh alur auth
// (credentials signIn, session fetch, signOut).

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
