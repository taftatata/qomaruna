"use client";

import * as React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, X, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SoftAuthBannerProps {
  /** Called ketika user dismiss banner (sembunyi permanen via localStorage) */
  onDismiss?: () => void;
}

const STORAGE_KEY = "fiqh_softauth_dismissed";

export function SoftAuthBanner({ onDismiss }: SoftAuthBannerProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Cek localStorage — user mungkin sudah dismiss sebelumnya
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.localStorage.getItem(STORAGE_KEY) === "true";
    if (dismissed) setHidden(true);
  }, []);

  function handleDismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
    setHidden(true);
    onDismiss?.();
  }

  async function handleRegister() {
    setSubmitting(true);
    // Simulasi: dalam produksi ini akan panggil NextAuth/Firebase Auth
    // Untuk sekarang, tampilkan toast info & update flag isGuest=false
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isGuest: false }),
      });
      if (!res.ok) throw new Error("Gagal mendaftarkan akun");
      toast({
        title: "Akun terdaftar",
        description:
          "Data Adat Anda kini tersimpan permanen dan dapat diakses lintas perangkat.",
      });
      setOpen(false);
      handleDismiss();
    } catch (e) {
      toast({
        title: "Gagal mendaftar",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (hidden) return null;

  return (
    <>
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
          <strong>Mode Tamu:</strong> Simpan data Adat Anda agar tidak hilang
          dengan{" "}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-semibold underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-100"
          >
            Daftar/Login
          </button>
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Tutup banner"
          className="shrink-0 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded p-1"
        >
          <X className="size-3.5" />
        </button>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-rose-600" />
              Daftar / Login
            </DialogTitle>
            <DialogDescription>
              Dengan mendaftar, data Adat &amp; catatan pendarahan Anda
              tersimpan permanen di akun dan dapat diakses dari perangkat lain.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1.5">
            <p>
              <strong>Keuntungan mendaftar:</strong>
            </p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Data Adat &amp; BloodLog tersinkron antar perangkat</li>
              <li>Backup otomatis — tidak hilang jika aplikasi dibersihkan</li>
              <li>Riwayat qada dapat diekspor sebagai laporan</li>
            </ul>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleRegister}
              disabled={submitting}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white min-h-[44px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 mr-1 animate-spin" /> Mendaftarkan...
                </>
              ) : (
                <>
                  <UserPlus className="size-4 mr-1" /> Daftar Sekarang
                </>
              )}
            </Button>
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              disabled={submitting}
              className="w-full min-h-[44px]"
            >
              Nanti Saja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

