"use client";

import { motion } from "framer-motion";
import { UserPlus, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SoftAuthBannerProps {
  /** Dipanggil saat tombol "Daftar/Login" diklik — membuka LoginDialog (page-level). */
  onLoginClick: () => void;
}

/**
 * Indikator Guest Mode di Dashboard (spec):
 * "Mode Tamu: Perhitungan menggunakan data standar. Login untuk menyesuaikan
 * dengan Adat Anda."
 */
export function SoftAuthBanner({ onLoginClick }: SoftAuthBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900",
        "px-3 py-2.5 flex items-center gap-2",
      )}
      role="status"
      aria-live="polite"
    >
      <ShieldCheck className="size-4 text-amber-600 shrink-0" aria-hidden />
      <p className="text-[11px] sm:text-xs text-amber-900 dark:text-amber-200 flex-1 min-w-0">
        <strong>Mode Tamu:</strong> Perhitungan menggunakan data standar
        (Adat Haid 7 hari, Suci 23 hari).{" "}
        <button
          type="button"
          onClick={onLoginClick}
          className="font-semibold underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-100 inline-flex items-center gap-0.5"
        >
          <UserPlus className="size-3" aria-hidden /> Login untuk menyesuaikan
          dengan Adat Anda
        </button>
      </p>
    </motion.div>
  );
}
