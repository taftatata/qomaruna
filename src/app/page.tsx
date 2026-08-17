"use client";

import * as React from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Droplets, ShieldCheck, PlusCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { StatusDashboard } from "@/components/fiqh/StatusDashboard";
import { StatsCards } from "@/components/fiqh/StatsCards";
import { BloodEntryForm } from "@/components/fiqh/BloodEntryForm";
import { InteractiveCalendar } from "@/components/fiqh/InteractiveCalendar";
import { QadaList, type QadaItem } from "@/components/fiqh/QadaList";
import { CekKesucianFAB } from "@/components/fiqh/CekKesucianFAB";
import { BottomNav, type ScreenKey } from "@/components/fiqh/BottomNav";
import { ProfilScreen } from "@/components/fiqh/ProfilScreen";
import { OnboardingFlow } from "@/components/fiqh/OnboardingFlow";
import { SoftAuthBanner } from "@/components/fiqh/SoftAuthBanner";

import {
  IbadahStatus,
  MustahadahCategory,
  type BloodLog,
} from "@/lib/fiqh/types";

// ──────────────────────────────────────────────────────────────────────────
// Tipe respons API
// ──────────────────────────────────────────────────────────────────────────
interface UserData {
  id: string;
  uid: string;
  menarcheDate: string | null;
  adatHaid: number;
  adatSuci: number;
  mustahadahCat: MustahadahCategory;
  onboarded: boolean;
  isGuest: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StatusData {
  status: IbadahStatus;
  reason: string;
  mustahadahLabel: string;
  totalBleedingHours: number;
  totalBleedingDays: number;
  isExceedsMaxDays: boolean;
  kapasVerified: boolean;
  instructions: string[];
  haidLogCount: number;
  istihadahLogCount: number;
  qadaPendingCount: number;
  qadaTotalCount: number;
}

interface BloodLogsData {
  logs: Array<{
    id: string;
    userId: string;
    startTime: string;
    endTime: string | null;
    colorWeight: number;
    colorLabel: string;
    traitWeight: number;
    traitLabel: string;
    isKapasPutih: boolean;
    note: string | null;
    createdAt: string;
  }>;
}

interface QadaData {
  qada: Array<{
    id: string;
    prayerName: string;
    prayerDate: string;
    reason: string;
    isResolved: boolean;
  }>;
}

// ──────────────────────────────────────────────────────────────────────────
// Inner dashboard
// ──────────────────────────────────────────────────────────────────────────
function Dashboard() {
  const qc = useQueryClient();
  const [screen, setScreen] = React.useState<ScreenKey>("beranda");

  const userQuery = useQuery<UserData>({
    queryKey: ["user"],
    queryFn: async () => {
      const r = await fetch("/api/user", { cache: "no-store" });
      if (!r.ok) throw new Error("Gagal memuat user");
      return r.json();
    },
  });

  const statusQuery = useQuery<StatusData>({
    queryKey: ["status"],
    queryFn: async () => {
      const r = await fetch("/api/status", { cache: "no-store" });
      if (!r.ok) throw new Error("Gagal memuat status");
      return r.json();
    },
    refetchInterval: 60_000,
    enabled: !!userQuery.data?.onboarded,
  });

  const logsQuery = useQuery<BloodLogsData>({
    queryKey: ["blood-logs", 60],
    queryFn: async () => {
      const r = await fetch("/api/blood-logs?days=60", { cache: "no-store" });
      if (!r.ok) throw new Error("Gagal memuat catatan darah");
      return r.json();
    },
    enabled: !!userQuery.data?.onboarded,
  });

  const qadaQuery = useQuery<QadaData>({
    queryKey: ["qada"],
    queryFn: async () => {
      const r = await fetch("/api/qada", { cache: "no-store" });
      if (!r.ok) throw new Error("Gagal memuat qada");
      return r.json();
    },
    enabled: !!userQuery.data?.onboarded,
  });

  function refreshAll() {
    qc.invalidateQueries({ queryKey: ["user"] });
    qc.invalidateQueries({ queryKey: ["status"] });
    qc.invalidateQueries({ queryKey: ["blood-logs"] });
    qc.invalidateQueries({ queryKey: ["qada"] });
  }

  // ── Conditional: Onboarding gate ────────────────────────────────────────
  if (userQuery.isLoading) {
    return <FullScreenLoader />;
  }
  if (userQuery.data && !userQuery.data.onboarded) {
    return (
      <OnboardingFlow
        initialData={{
          menarcheDate: userQuery.data.menarcheDate ?? "",
          adatHaid: userQuery.data.adatHaid,
          adatSuci: userQuery.data.adatSuci,
        }}
        onCompleted={refreshAll}
      />
    );
  }

  // ── Dashboard (sudah onboarded) ─────────────────────────────────────────
  const isLoading =
    statusQuery.isLoading || userQuery.isLoading || logsQuery.isLoading;

  const logsAsDomain: BloodLog[] = (logsQuery.data?.logs ?? []).map((l) => ({
    id: l.id,
    userId: l.userId,
    startTime: new Date(l.startTime),
    endTime: l.endTime ? new Date(l.endTime) : null,
    colorWeight: l.colorWeight as BloodLog["colorWeight"],
    colorLabel: l.colorLabel,
    traitWeight: l.traitWeight as BloodLog["traitWeight"],
    traitLabel: l.traitLabel,
    isKapasPutih: l.isKapasPutih,
    note: l.note,
    createdAt: new Date(l.createdAt),
  }));

  const qadaItems: QadaItem[] = (qadaQuery.data?.qada ?? []).map((q) => ({
    id: q.id,
    prayerName: q.prayerName,
    prayerDate: q.prayerDate,
    reason: q.reason,
    isResolved: q.isResolved,
  }));

  const qadaPending = statusQuery.data?.qadaPendingCount ?? 0;
  const currentStatus = statusQuery.data?.status ?? IbadahStatus.SUCI;
  const isGuest = userQuery.data?.isGuest ?? true;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-700 text-white flex items-center justify-center shrink-0">
              <Droplets className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold leading-tight truncate">
                Darah dalam Perempuan
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight truncate">
                Sistem Pakar Fikih Wanita · Mazhab Syafi&apos;i
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-4 pb-28 sm:pb-32 flex flex-col gap-4">
        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            {/* Soft-Auth Banner — only for guest users */}
            {isGuest && (
              <SoftAuthBanner onDismiss={() => {}} />
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={screen}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex flex-col gap-4"
              >
                {screen === "beranda" && (
                  <BerandaScreen
                    status={currentStatus}
                    reason={statusQuery.data?.reason ?? ""}
                    mustahadahLabel={statusQuery.data?.mustahadahLabel}
                    instructions={statusQuery.data?.instructions}
                    totalBleedingHours={
                      statusQuery.data?.totalBleedingHours ?? 0
                    }
                    totalBleedingDays={
                      statusQuery.data?.totalBleedingDays ?? 0
                    }
                    mustahadahCategory={
                      userQuery.data?.mustahadahCat ??
                      MustahadahCategory.MUBTADAAH_MUMAYYIZAH
                    }
                    adatHaid={userQuery.data?.adatHaid ?? 6}
                    adatSuci={userQuery.data?.adatSuci ?? 23}
                    qadaPending={qadaPending}
                    qadaTotal={statusQuery.data?.qadaTotalCount ?? 0}
                    recentLogs={logsAsDomain.slice(0, 3)}
                    hasAnyLogs={logsAsDomain.length > 0}
                    onGoToCatat={() => setScreen("catat")}
                  />
                )}

                {screen === "catat" && <BloodEntryForm onSaved={refreshAll} />}

                {screen === "kalender" && (
                  <InteractiveCalendar logs={logsAsDomain} />
                )}

                {screen === "qada" && (
                  <QadaList
                    items={qadaItems}
                    onResolvedChange={() => refreshAll()}
                  />
                )}

                {screen === "profil" && userQuery.data && (
                  <ProfilScreen user={userQuery.data} onSaved={refreshAll} />
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </main>

      <BottomNav
        active={screen}
        onChange={setScreen}
        qadaPending={qadaPending}
      />

      <CekKesucianFAB onVerified={refreshAll} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Beranda — sekarang dengan empty state (SUCI default + CTA)
// ──────────────────────────────────────────────────────────────────────────
interface BerandaScreenProps {
  status: IbadahStatus;
  reason: string;
  mustahadahLabel?: string;
  instructions?: string[];
  totalBleedingHours: number;
  totalBleedingDays: number;
  mustahadahCategory: MustahadahCategory;
  adatHaid: number;
  adatSuci: number;
  qadaPending: number;
  qadaTotal: number;
  recentLogs: BloodLog[];
  hasAnyLogs: boolean;
  onGoToCatat: () => void;
}

function BerandaScreen({
  status,
  reason,
  mustahadahLabel,
  instructions,
  totalBleedingHours,
  totalBleedingDays,
  mustahadahCategory,
  adatHaid,
  adatSuci,
  qadaPending,
  qadaTotal,
  recentLogs,
  hasAnyLogs,
  onGoToCatat,
}: BerandaScreenProps) {
  return (
    <div className="flex flex-col gap-4">
      <StatusDashboard
        status={status}
        reason={reason}
        mustahadahLabel={mustahadahLabel}
        instructions={instructions}
      />

      <StatsCards
        totalBleedingHours={totalBleedingHours}
        totalBleedingDays={totalBleedingDays}
        mustahadahCategory={mustahadahCategory}
        adatHaid={adatHaid}
        adatSuci={adatSuci}
        qadaPending={qadaPending}
        qadaTotal={qadaTotal}
      />

      {/* Empty state CTA — tampil saat belum ada BloodLog */}
      {!hasAnyLogs && (
        <Card className="border-dashed border-2 border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20">
          <CardContent className="px-4 py-6 flex flex-col items-center gap-3 text-center">
            <div className="size-14 rounded-full bg-gradient-to-br from-rose-500 to-pink-700 text-white flex items-center justify-center">
              <Sparkles className="size-7" aria-hidden />
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                Selamat datang! Mulai catat pendarahan pertama Anda
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Anda saat ini dalam status <strong>SUCI</strong>. Begitu darah
                keluar, catat di sini agar sistem dapat menghitung status
                ibadah Anda.
              </p>
            </div>
            <Button
              onClick={onGoToCatat}
              className="bg-rose-600 hover:bg-rose-700 text-white min-h-[48px] px-6 gap-2 shadow-lg shadow-rose-500/30"
            >
              <PlusCircle className="size-5" />
              Catat Darah Keluar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick action — Catat Darah */}
      <Card className="py-4">
        <CardContent className="px-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-sm">Catat Pendarahan Baru</p>
            <p className="text-xs text-muted-foreground">
              Pilih warna &amp; sifat darah untuk memperbarui status ibadah
            </p>
          </div>
          <Button
            onClick={onGoToCatat}
            className="bg-rose-600 hover:bg-rose-700 text-white shrink-0"
            size="sm"
          >
            + Catat
          </Button>
        </CardContent>
      </Card>

      {/* Recent logs (hide if empty) */}
      {hasAnyLogs && (
        <Card>
          <CardContent className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Catatan Terbaru</h3>
              <Badge variant="outline" className="text-[10px]">
                {recentLogs.length} entri
              </Badge>
            </div>
            <ul className="space-y-2">
              {recentLogs.map((log) => (
                <RecentLogRow key={log.id} log={log} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="text-[10px] text-muted-foreground leading-relaxed pt-2">
        Aplikasi ini adalah alat bantu ibadah berdasarkan buku{" "}
        <strong>&ldquo;Darah dalam Perempuan&rdquo;</strong> (Khusnul Khotimah).
        Untuk fatwa definitif, konsultasikan dengan ulama ahli fiqih wanita.
        Data tersimpan lokal via Prisma (substitusi Firestore).
      </p>
    </div>
  );
}

function RecentLogRow({ log }: { log: BloodLog }) {
  const time = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(log.startTime);

  const colorHex: Record<number, string> = {
    1: "#d1d5db",
    2: "#eab308",
    3: "#92400e",
    4: "#dc2626",
    5: "#0a0a0a",
  };

  return (
    <li className="flex items-center gap-3 py-1.5 border-b last:border-0">
      <span
        className="size-3 rounded-full shrink-0 ring-1 ring-black/10"
        style={{ backgroundColor: colorHex[log.colorWeight] ?? "#999" }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate">
          {log.colorLabel} · {log.traitLabel}
        </p>
        <p className="text-[10px] text-muted-foreground">{time}</p>
      </div>
      {log.isKapasPutih && (
        <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
          <ShieldCheck className="size-3" /> Suci
        </Badge>
      )}
    </li>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="py-4">
            <CardContent className="px-4 flex flex-col gap-2">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="size-10 rounded-full border-4 border-rose-200 border-t-rose-600 animate-spin" />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Page wrapper
// ──────────────────────────────────────────────────────────────────────────
export default function Home() {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <Dashboard />
    </QueryClientProvider>
  );
}
