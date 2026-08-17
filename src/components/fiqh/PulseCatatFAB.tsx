"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Droplet } from "lucide-react";
import { cn } from "@/lib/utils";

interface PulseCatatFABProps {
  /** Tampilkan FAB (true untuk user baru yang belum punya BloodLog) */
  visible: boolean;
  /** Dipanggil saat FAB diklik — biasanya switch ke tab Catat */
  onClick: () => void;
}

/**
 * Floating Action Button "Catat Darah Keluar" dengan animasi pulse.
 * Hanya muncul untuk user baru (belum ada BloodLog) sebagai CTA yang mencolok.
 * FAB ini berbeda dari CekKesucianFAB (yang untuk verifikasi suci).
 */
export function PulseCatatFAB({ visible, onClick }: PulseCatatFABProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={onClick}
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          whileTap={{ scale: 0.92 }}
          aria-label="Catat Darah Keluar"
          className={cn(
            // Posisi: bottom-left, di atas bottom nav, tidak bentrok dengan CekKesucianFAB di kanan
            "fixed left-4 bottom-20 sm:bottom-24 z-30",
            "rounded-full pl-5 pr-4 py-3.5 min-h-[56px]",
            "bg-gradient-to-r from-rose-500 to-pink-600 text-white",
            "shadow-xl shadow-rose-500/40 flex items-center gap-2 font-semibold",
            "ring-2 ring-white/30",
          )}
        >
          {/* Pulse ring (animated background) */}
          <motion.span
            className="absolute inset-0 rounded-full bg-rose-400 -z-10"
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 1.4 }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeOut",
            }}
            aria-hidden
          />
          <motion.span
            className="absolute inset-0 rounded-full bg-rose-400 -z-10"
            initial={{ opacity: 0.4, scale: 1 }}
            animate={{ opacity: 0, scale: 1.4 }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.9,
            }}
            aria-hidden
          />
          <Droplet className="size-5" aria-hidden />
          <span className="text-sm">Catat Darah Keluar</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
