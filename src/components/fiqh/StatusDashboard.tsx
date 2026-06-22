"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ShieldAlert, Droplet, Ban } from "lucide-react";
import { IbadahStatus } from "@/lib/fiqh/types";
import { cn } from "@/lib/utils";

interface StatusDashboardProps {
  status: IbadahStatus;
  reason: string;
  mustahadahLabel?: string;
  instructions?: string[];
}

interface StatusVisual {
  key: string;
  label: string;
  description: string;
  containerClass: string;
  icon: React.ReactNode;
}

function visualsFor(status: IbadahStatus): StatusVisual {
  switch (status) {
    case IbadahStatus.HARAM_IBADAH:
      return {
        key: "haram",
        label: "🚫 HARAM IBADAH",
        description:
          "Sedang dalam haid/nifas. Salat & puasa HARAM dikerjakan. Wajib diqada setelah suci.",
        containerClass: "bg-red-600 text-white",
        icon: <Ban className="size-7" aria-hidden />,
      };
    case IbadahStatus.WAJIB_SALAT_ISTIHADAH:
      return {
        key: "istihadah",
        label: "🕌 WAJIB SALAT — ISTIHADAH",
        description:
          "Pendarahan istihadah. Salat & puasa TETAP wajib. Wajib wudu setiap kali keluar darah.",
        containerClass: "bg-blue-600 text-white",
        icon: <Droplet className="size-7" aria-hidden />,
      };
    case IbadahStatus.MASA_IHTIYATH:
      return {
        key: "ihtiyath",
        label: "⚠️ MASA IHTIYATH / HATI-HATI",
        description:
          "Status belum pasti (Mutahayyirah). Lakukan ihtiyath: anggap hari ambigu sebagai haid (tinggalkan salat) DAN qada setelahnya.",
        containerClass: "bg-amber-400 text-amber-950",
        icon: <ShieldAlert className="size-7" aria-hidden />,
      };
    case IbadahStatus.SUCI:
    default:
      return {
        key: "suci",
        label: "✅ SUCI",
        description:
          "Sudah suci (terverifikasi tes kapas putih). Bebas mengerjakan seluruh ibadah.",
        containerClass: "bg-emerald-600 text-white",
        icon: <CheckCircle2 className="size-7" aria-hidden />,
      };
  }
}

export function StatusDashboard({
  status,
  reason,
  mustahadahLabel,
  instructions = [],
}: StatusDashboardProps) {
  const v = visualsFor(status);
  return (
    <section
      aria-label="Status ibadah saat ini"
      className="w-full"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={v.key}
          initial={{ opacity: 0, scale: 0.97, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -6 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "rounded-2xl shadow-lg p-6 sm:p-8 flex flex-col gap-3",
            v.containerClass,
          )}
        >
          <div className="flex items-center gap-3">
            {v.icon}
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
              {v.label}
            </h2>
          </div>
          <p className="text-sm sm:text-base opacity-95">{v.description}</p>
          {mustahadahLabel && (
            <p className="text-xs sm:text-sm opacity-90">
              Kategori Mustahadah:{" "}
              <span className="font-semibold">{mustahadahLabel}</span>
            </p>
          )}
          <p className="text-xs sm:text-sm opacity-90 italic border-t border-white/20 pt-3 mt-1">
            {reason}
          </p>
          {instructions.length > 0 && (
            <ul className="mt-1 space-y-1.5 text-xs sm:text-sm">
              {instructions.map((inst, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden>•</span>
                  <span>{inst}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
