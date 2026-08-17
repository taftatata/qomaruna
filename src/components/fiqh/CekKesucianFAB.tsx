"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, Lock } from "lucide-react";
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

interface CekKesucianFABProps {
  /** Kontrol buka/tutup dialog dari page (untuk seamless resume setelah login). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** true jika user belum login → klik FAB membuka mandatory LoginDialog. */
  isGuest: boolean;
  /** Dipanggil saat guest mengklik FAB (page membuka LoginDialog mandatory). */
  onRequireLogin: () => void;
  onVerified: () => void;
}

export function CekKesucianFAB({
  open,
  onOpenChange,
  isGuest,
  onRequireLogin,
  onVerified,
}: CekKesucianFABProps) {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function handleConfirm(clean: boolean) {
    if (!clean) {
      toast({
        title: "Belum suci",
        description:
          "Kapas masih berwarna. Tetap dalam status saat ini hingga benar-benar bersih.",
      });
      onOpenChange(false);
      return;
    }
    setSubmitting(true);
    try {
      // Buat entri BloodLog khusus dengan isKapasPutih=true untuk menutup
      // episode pendarahan & memvalidasi status SUCI.
      const now = new Date();
      const startIso = new Date(now.getTime() - 60 * 1000).toISOString(); // 1 menit lalu
      const res = await fetch("/api/blood-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: startIso,
          endTime: now.toISOString(),
          colorWeight: 1, // Keruh (terlemah) — karena kapas bersih
          traitWeight: 1, // Encer & tidak berbau
          isKapasPutih: true,
          note: "Tes kapas: putih bersih — suci terverifikasi.",
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan verifikasi");
      toast({
        title: "Status: SUCI",
        description:
          "Verifikasi kapas putih tersimpan. Anda bebas mengerjakan ibadah.",
      });
      onOpenChange(false);
      onVerified();
    } catch (e) {
      toast({
        title: "Gagal menyimpan",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => {
          if (isGuest) {
            onRequireLogin();
            return;
          }
          onOpenChange(true);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Cek kesucian (tes kapas)"
        className={cn(
          // Sit above the bottom nav (h-16 = 64px + safe area)
          "fixed right-4 bottom-20 sm:bottom-24 z-30",
          "rounded-full p-4 min-h-[56px] min-w-[56px]",
          "bg-gradient-to-br from-rose-500 to-pink-600 text-white",
          "shadow-lg shadow-rose-500/30 flex items-center justify-center",
          "ring-2 ring-white/20",
        )}
      >
        {isGuest ? (
          <Lock className="size-5" />
        ) : (
          <ShieldCheck className="size-5" />
        )}
        <span className="sr-only">Cek Kesucian</span>
      </motion.button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-rose-600" />
              Verifikasi Kesucian (Tes Kapas)
            </DialogTitle>
            <DialogDescription>
              Masukkan kapas ke farji, tunggu beberapa saat, perhatikan warna
              hasilnya. Status “SUCI” hanya berlaku jika kapas putih bersih
              (tidak ada noda darah).
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p>
              <strong>Tata cara:</strong> Setelah masa haid berakhir (tidak
              ada darah keluar), masukkan kapas putih ke farji pada pagi hari
              sebelum mandi wajib. Jika kapas tetap putih bersih, suci
              terkonfirmasi.
            </p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => handleConfirm(true)}
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white min-h-[48px]"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              Kapas Putih Bersih (SUCI)
            </Button>
            <Button
              onClick={() => handleConfirm(false)}
              disabled={submitting}
              variant="destructive"
              className="w-full min-h-[48px]"
            >
              Kapas Masih Berwarna (Belum Suci)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
