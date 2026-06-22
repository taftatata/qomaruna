"use client";

import * as React from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Droplets } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { StatusDashboard } from "@/components/fiqh/StatusDashboard";
import { StatsCards } from "@/components/fiqh/StatsCards";
import { BloodEntryForm } from "@/components/fiqh/BloodEntryForm";
import { InteractiveCalendar } from "@/components/fiqh/InteractiveCalendar";
import { QadaList, type QadaItem } from "@/components/fiqh/QadaList";
import { CekKesucianFAB } from "@/components/fiqh/CekKesucianFAB";

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
  createdAt: string;
  updatedAt: string;
}

interface StatusData {
  status: IbadahStatus;
  reason: string;
  mustahadahCategory: MustahadahCategory;
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
// Inner dashboard (menggunakan useQuery hooks)
// ──────────────────────────────────────────────────────────────────────────
function Dashboard() {
  const qc = useQueryClient();

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
    refetchInterval: 60_000, // recompute tiap menit (qada/instruksi sensitif waktu)
  });

  const logsQuery = useQuery<BloodLogsData>({
    queryKey: ["blood-logs", 60],
    queryFn: async () => {
      const r = await fetch("/api/blood-logs?days=60", { cache: "no-store" });
      if (!r.ok) throw new Error("Gagal memuat catatan darah");
      return r.json();
    },
  });

  const qadaQuery = useQuery<QadaData>({
    queryKey: ["qada"],
    queryFn: async () => {
      const r = await fetch("/api/qada", { cache: "no-store" });
      if (!r.ok) throw new Error("Gagal memuat qada");
      return r.json();
    },
  });

  function refreshAll() {
    qc.invalidateQueries({ queryKey: ["status"] });
    qc.invalidateQueries({ queryKey: ["blood-logs"] });
    qc.invalidateQueries({ queryKey: ["qada"] });
  }

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-700 text-white flex items-center justify-center shrink-0">
              <Droplets className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold leading-tight truncate">
                Darah dalam Perempuan
              </h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight truncate">
                Sistem Pakar Fikih Wanita · Mazhab Syafi&apos;i
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-5 sm:py-6 flex flex-col gap-5">
        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            <StatusDashboard
              status={statusQuery.data?.status ?? IbadahStatus.SUCI}
              reason={statusQuery.data?.reason ?? ""}
              mustahadahLabel={statusQuery.data?.mustahadahLabel}
              instructions={statusQuery.data?.instructions}
            />

            <StatsCards
              totalBleedingHours={statusQuery.data?.totalBleedingHours ?? 0}
              totalBleedingDays={statusQuery.data?.totalBleedingDays ?? 0}
              mustahadahCategory={
                userQuery.data?.mustahadahCat ??
                MustahadahCategory.MUBTADAAH_MUMAYYIZAH
              }
              adatHaid={userQuery.data?.adatHaid ?? 6}
              adatSuci={userQuery.data?.adatSuci ?? 23}
              qadaPending={statusQuery.data?.qadaPendingCount ?? 0}
              qadaTotal={statusQuery.data?.qadaTotalCount ?? 0}
            />

            <Tabs defaultValue="catat" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="catat" className="min-h-[44px]">
                  Catat Darah
                </TabsTrigger>
                <TabsTrigger value="kalender" className="min-h-[44px]">
                  Kalender
                </TabsTrigger>
                <TabsTrigger value="qada" className="min-h-[44px]">
                  Qada
                  {(statusQuery.data?.qadaPendingCount ?? 0) > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center size-4 rounded-full bg-destructive text-white text-[10px] font-bold">
                      {statusQuery.data?.qadaPendingCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="catat" className="mt-4">
                <BloodEntryForm onSaved={refreshAll} />
              </TabsContent>
              <TabsContent value="kalender" className="mt-4">
                <InteractiveCalendar logs={logsAsDomain} />
              </TabsContent>
              <TabsContent value="qada" className="mt-4">
                <QadaList
                  items={qadaItems}
                  onResolvedChange={() => refreshAll()}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-muted-foreground space-y-1.5">
          <p>
            Aplikasi ini adalah alat bantu ibadah berdasarkan buku{" "}
            <strong>&ldquo;Darah dalam Perempuan&rdquo;</strong> (Khusnul
            Khotimah). Untuk fatwa definitif, konsultasikan dengan ulama ahli
            fiqih wanita.
          </p>
          <p className="text-[11px] opacity-80">
            Data tersimpan lokal via Prisma (substitusi Firestore).
          </p>
        </div>
      </footer>

      <CekKesucianFAB onVerified={refreshAll} />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="py-4">
            <CardContent className="px-4 flex flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-6 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Page wrapper — provides React Query client
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
