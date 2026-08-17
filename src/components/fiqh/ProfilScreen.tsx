"use client";

import { useState } from "react";
import {
  UserCircle,
  CalendarDays,
  Clock,
  BookOpen,
  Info,
  ShieldCheck,
  UserPlus,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { MUSTAHADAH_LABELS, MustahadahCategory } from "@/lib/fiqh/types";

interface ProfilScreenProps {
  user: {
    id: string;
    uid: string;
    menarcheDate: string | null;
    adatHaid: number;
    adatSuci: number;
    mustahadahCat: MustahadahCategory;
    isOnboarded?: boolean;
    isGuest?: boolean;
  };
  onSaved: () => void;
}

export function ProfilScreen({ user, onSaved }: ProfilScreenProps) {
  const { toast } = useToast();
  const [adatHaid, setAdatHaid] = useState(String(user.adatHaid));
  const [adatSuci, setAdatSuci] = useState(String(user.adatSuci));
  const [mustahadahCat, setMustahadahCat] = useState<MustahadahCategory>(
    user.mustahadahCat,
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adatHaid: Number(adatHaid) || 6,
          adatSuci: Number(adatSuci) || 23,
          mustahadahCat,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan profil");
      toast({
        title: "Profil tersimpan",
        description:
          "Adat haid, adat suci, dan kategori mustahadah diperbarui.",
      });
      onSaved();
    } catch (e) {
      toast({
        title: "Gagal menyimpan",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Identity header */}
      <Card className="py-4">
        <CardContent className="px-4 flex items-center gap-4">
          <div className="size-14 rounded-full bg-gradient-to-br from-rose-500 to-pink-700 text-white flex items-center justify-center shrink-0">
            <UserCircle className="size-8" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Pengguna aktif</p>
            <p className="font-semibold truncate">{user.uid}</p>
            <Badge variant="secondary" className="mt-1 text-[10px]">
              {MUSTAHADAH_LABELS[mustahadahCat]}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Settings — Adat & Mustahadah */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-4 text-rose-600" aria-hidden />
            Pengaturan Siklus (Adat)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="adatHaid" className="text-xs">
                Adat Haid (hari)
              </Label>
              <Input
                id="adatHaid"
                type="number"
                min={1}
                max={15}
                inputMode="numeric"
                value={adatHaid}
                onChange={(e) => setAdatHaid(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Maks 15 hari (batas haid)
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adatSuci" className="text-xs">
                Adat Suci (hari)
              </Label>
              <Input
                id="adatSuci"
                type="number"
                min={15}
                max={60}
                inputMode="numeric"
                value={adatSuci}
                onChange={(e) => setAdatSuci(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Min 15 hari antar haid
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mustahadah" className="text-xs">
              Kategori Mustahadah
            </Label>
            <Select
              value={mustahadahCat}
              onValueChange={(v) =>
                setMustahadahCat(v as MustahadahCategory)
              }
            >
              <SelectTrigger id="mustahadah" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MUSTAHADAH_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Digunakan oleh mesin klasifikasi Tamayyiz
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white min-h-[44px]"
          >
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </CardContent>
      </Card>

      {/* Rules reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4 text-emerald-600" aria-hidden />
            Ringkasan Aturan Fikih
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <RuleRow
            icon={<CalendarDays className="size-4 text-rose-600" />}
            title="Syarat Haid"
            desc="Akumulasi ≥ 24 jam dalam 15 hari. Maks 15 hari 15 malam."
          />
          <Separator />
          <RuleRow
            icon={<ShieldCheck className="size-4 text-emerald-600" />}
            title="Syarat Suci"
            desc="Jeda ≥ 15 hari antar dua haid. Wajib tes kapas putih."
          />
          <Separator />
          <RuleRow
            icon={<Clock className="size-4 text-amber-600" />}
            title="Syarat Nifas"
            desc="Minimal setetes, umumnya 40 hari, maksimal 60 hari."
          />
          <Separator />
          <RuleRow
            icon={<BookOpen className="size-4 text-violet-600" />}
            title="Tamayyiz (Kekuatan Darah)"
            desc="Warna: Hitam &gt; Merah &gt; Cokelat &gt; Kuning &gt; Keruh. Sifat: Kental & Berbau &gt; Kental &gt; Berbau &gt; Encer."
          />
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="size-4 text-blue-600" aria-hidden />
            Tentang Aplikasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p>
            Sistem Pakar Fikih Wanita berdasarkan buku{" "}
            <strong>&ldquo;Darah dalam Perempuan&rdquo;</strong> karya Khusnul
            Khotimah, Mazhab Syafi&apos;i.
          </p>
          <p>
            Aplikasi ini menentukan status ibadah (Wajib/Haram Salat &amp;
            Puasa) berdasarkan parameter hukum fikih yang presisi.
          </p>
          <p className="text-[11px] opacity-80 pt-2 border-t">
            Data tersimpan lokal via Prisma (substitusi Firestore). Untuk fatwa
            definitif, konsultasikan dengan ulama ahli fiqih wanita.
          </p>
        </CardContent>
      </Card>

      {/* Login / Account — dipindah ke Profil sesuai permintaan */}
      <AccountCard isGuest={user.isGuest ?? true} onSaved={onSaved} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// AccountCard — Daftar/Login CTA (mode tamu) atau info akun (sudah login)
// ──────────────────────────────────────────────────────────────────────────
function AccountCard({
  isGuest,
  onSaved,
}: {
  isGuest: boolean;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  async function handleRegister() {
    setSaving(true);
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
          "Data Adat & catatan pendarahan Anda kini tersimpan permanen.",
      });
      onSaved();
    } catch (e) {
      toast({
        title: "Gagal mendaftar",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="size-4 text-rose-600" />
          Akun &amp; Penyimpanan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isGuest ? (
          <>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-3">
              <p className="text-xs font-medium text-amber-900 dark:text-amber-200 mb-1">
                Anda dalam Mode Tamu
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Data tersimpan lokal di perangkat ini. Daftarkan akun agar data
                tidak hilang saat aplikasi dibersihkan atau pindah perangkat.
              </p>
            </div>
            <Button
              onClick={handleRegister}
              disabled={saving}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white min-h-[44px]"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 mr-1 animate-spin" /> Mendaftarkan...
                </>
              ) : (
                <>
                  <UserPlus className="size-4 mr-1" /> Daftar / Login
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-3">
            <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200 mb-1">
              Akun terdaftar
            </p>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
              Data Adat &amp; catatan pendarahan tersimpan permanen dan dapat
              diakses lintas perangkat.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RuleRow({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="font-medium text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
