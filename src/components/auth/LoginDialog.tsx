"use client";

import * as React from "react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import {
  LogIn,
  UserPlus,
  Loader2,
  ShieldAlert,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export type LoginDialogMode = "dismissible" | "mandatory";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: LoginDialogMode;
  /** Dipanggil setelah login/daftar berhasil (session akan terbentuk). */
  onSuccess?: () => void;
  /** Dipanggil saat user memilih "Lihat-lihat dulu" (hanya mode dismissible). */
  onDismiss?: () => void;
}

const EDUCATIONAL_MESSAGE =
  "Data pendarahan Anda sangat penting. Silakan Login agar riwayat haid dan perhitungan Fikih Anda tersimpan aman dan akurat.";

/**
 * Dialog Login / Daftar — dipakai dua mode:
 *  - `dismissible`: dialog awal saat pertama kali aplikasi dibuka.
 *    Menawarkan Login/Daftar, atau "Lihat-lihat dulu" untuk masuk sebagai
 *    Guest (didismiss → Dashboard Guest).
 *  - `mandatory`: action-gate saat Guest mencoba Catat / Cek Kesucian.
 *    Tidak bisa di-dismiss — harus login/daftar untuk melanjutkan.
 */
export function LoginDialog({
  open,
  onOpenChange,
  mode = "dismissible",
  onSuccess,
  onDismiss,
}: LoginDialogProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const mandatory = mode === "mandatory";
  // Set setelah login/daftar berhasil → izinkan dialog ditutup (resume flow).
  const successRef = React.useRef(false);

  async function finish() {
    successRef.current = true;
    onSuccess?.();
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      toast({
        title: "Lengkapi data",
        description: "Masukkan email dan password Anda.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
      });
      if (!res || res.error) {
        toast({
          title: "Gagal masuk",
          description: "Email atau password salah.",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Berhasil masuk", description: "Selamat datang kembali." });
      resetForm();
      finish();
    } catch {
      toast({
        title: "Gagal masuk",
        description: "Terjadi kesalahan. Coba lagi.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister() {
    if (!email.trim() || password.length < 6) {
      toast({
        title: "Lengkapi data",
        description:
          "Email wajib diisi dan password minimal 6 karakter.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Gagal mendaftar" }));
        toast({
          title: "Gagal mendaftar",
          description: err.error,
          variant: "destructive",
        });
        return;
      }
      // Akun dibuat → langsung buat session.
      const signInRes = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
      });
      if (!signInRes || signInRes.error) {
        toast({
          title: "Akun dibuat",
          description: "Silakan masuk untuk melanjutkan.",
        });
        resetForm();
        finish();
        return;
      }
      toast({
        title: "Akun berhasil dibuat",
        description: "Arahkan Anda ke Onboarding Adat agar perhitungan akurat.",
      });
      resetForm();
      finish();
    } catch {
      toast({
        title: "Gagal mendaftar",
        description: "Terjadi kesalahan. Coba lagi.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setEmail("");
    setPassword("");
    setShowPw(false);
    setTab("login");
  }

  function handleOpenChange(next: boolean) {
    // Mode mandatory: tidak bisa ditutup kecuali sudah berhasil login/daftar.
    if (mandatory && !next && !successRef.current) return;
    onOpenChange(next);
    if (!next) {
      resetForm();
      // Tutup via X juga dianggap "dismiss" (tandai hasSeenInitialLogin).
      onDismiss?.();
    }
  }

  const isLogin = tab === "login";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!mandatory}
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          if (mandatory) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (mandatory) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLogin ? (
              <LogIn className="size-5 text-rose-600" />
            ) : (
              <UserPlus className="size-5 text-rose-600" />
            )}
            {isLogin ? "Masuk" : "Daftar Akun"}
          </DialogTitle>
          <DialogDescription>
            {mandatory
              ? EDUCATIONAL_MESSAGE
              : "Dengan masuk, data Adat & catatan pendarahan Anda tersimpan aman dan dapat diakses lintas perangkat."}
          </DialogDescription>
        </DialogHeader>

        {mandatory && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-3">
            <ShieldAlert className="size-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-900 dark:text-amber-200">
              Anda sedang dalam <strong>Mode Tamu</strong>. Untuk mencatat
              pendarahan dan menghitung Qada secara akurat, masuk ke akun Anda.
            </p>
          </div>
        )}

        {/* Tab toggle Masuk / Daftar */}
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md py-2 text-sm font-medium transition-colors",
                tab === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={tab === t}
            >
              {t === "login" ? "Masuk" : "Daftar"}
            </button>
          ))}
        </div>

        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (isLogin) handleLogin();
            else handleRegister();
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="nama@contoh.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="login-password">Password</Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPw ? "text" : "password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder={isLogin ? "••••••••" : "Minimal 6 karakter"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {isLogin
                ? "Gunakan akun yang pernah didaftarkan."
                : "Password akan di-hash (bcrypt) sebelum disimpan."}
            </p>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white min-h-[44px]"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 mr-1 animate-spin" />
                {isLogin ? "Memproses..." : "Mendaftarkan..."}
              </>
            ) : isLogin ? (
              <>
                <LogIn className="size-4 mr-1" /> Masuk
              </>
            ) : (
              <>
                <UserPlus className="size-4 mr-1" /> Daftar
              </>
            )}
          </Button>
        </form>

        {!mandatory && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
                onDismiss?.();
              }}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Lihat-lihat dulu
            </Button>
            <p className="text-[10px] text-muted-foreground text-center sm:text-left">
              Masuk sebagai <strong>Tamu</strong> — data tidak tersimpan permanen.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
