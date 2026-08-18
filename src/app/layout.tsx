export const runtime = 'nodejs';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthSessionProvider } from "@/components/auth/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistem Pakar Fikih Wanita — Darah dalam Perempuan",
  description:
    "Pelacak darah perempuan (haid/nifas/istihadah) berdasarkan Mazhab Syafi'i, buku 'Darah dalam Perempuan' (Khusnul Khotimah). Menentukan status ibadah: Wajib / Haram salat & puasa.",
  keywords: [
    "fiqih wanita",
    "haid",
    "nifas",
    "istihadah",
    "mazhab syafi'i",
    "darah perempuan",
    "qada salat",
  ],
  authors: [{ name: "Sistem Pakar Fikih" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthSessionProvider>{children}</AuthSessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
