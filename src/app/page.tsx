"use client";

import * as React from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Droplets, ShieldCheck, PlusCircle, Sparkles, Lock } from "lucide-react";
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
import { PulseCatatFAB } from "@/components/fiqh/PulseCatatFAB";
import { LoginDialog, type LoginDialogMode } from "@/components/auth/LoginDialog";

import {
  IbadahStatus,
  MustahadahCategory,
  type BloodLog,
} from "@/lib/fiqh/types";
import { useGuestStore, GUEST_DEFAULTS } from "@/lib/stores/guest-store";

// ──────────────────────────────────────────────────────────────────────────
// Konstanta
// ──────────────────────────────────────────────────────────────────────────
const HAS_SEEN_INITIAL_LOGIN = "hasSeenInitialLogin";

type PendingAction = "catat" | "cek_kesucian" | null;

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
  isOnboarded: boolean;
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

  // Zustand store for guestData (client-side persistence + real-time calc)
  const hydrateGuest = useGuestStore((s) => s.hydrate);

  // ── Session (NextAuth) ───────────────────────────────────────────────────
  const { status: authStatus } = useSession();
  const isGuest = authStatus !== "authenticated";

  // ── State dialog Login & action-gate ─────────────────────────────────────
  const [seenInitial, setSeenInitial] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(HAS_SEEN_INITIAL_LOGIN) === "true";
  });
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [loginMode, setLoginMode] = React.useState<LoginDialogMode>("dismissible");
  const [pendingAction, setPendingAction] = React.useState<PendingAction>(null);
  const [cekOpen, setCekOpen] = React.useState(false);
  const initialShownRef = React.useRef(false);

  function markSeenInitial() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(HAS_SEEN_INITIAL_LOGIN, "true");
    }
    setSeenInitial(true);
  }

  /** Buka LoginDialog biasa (dismissible / mandatory sesuai mode). */
  function requestLogin(mode: LoginDialogMode) {
    setLoginMode(mode);
    setLoginOpen(true);
  }

  /**
   * Action-gate: guest mencoba Catat / Cek Kesucian → cegah akses form,
   * buka LoginDialog mandatory (tidak bisa di-dismiss).
   */
  function requestAction(action: Exclude<PendingAction, null>) {
    setPendingAction(action);
    setLoginMode("mandatory");
    setLoginOpen(true);
  }

  function handleLoginSuccess() {
    markSeenInitial();
    setLoginOpen(false);
    // Session akan berubah → effect navigasi di bawah menangani resume.
  }

  // ── Initial Login Dialog (dismissible, sekali per kunjungan) ─────────────
  React.useEffect(() => {
    if (authStatus === "loading") return;
    if (authStatus === "authenticated") return; // sudah login
    if (seenInitial) return; // sudah pernah dilihat (localStorage)
    if (pendingAction) return; // mandatory dialog lebih prioritas
    if (initialShownRef.current) return;
    initialShownRef.current = true;
    setLoginMode("dismissible");
    setLoginOpen(true);
  }, [authStatus, seenInitial, pendingAction]);

  // ── Query user (hanya jika login) ────────────────────────────────────────
  const userQuery = useQuery<UserData>({
    queryKey: ["user"],
    queryFn: async () => {
      const r = await fetch("/api/user", { cache: "no-store" });
      if (!r.ok) throw new Error("Gagal memuat user");
      return r.json();
    },
    enabled: authStatus === "authenticated",
  });

  // Hydrate Zustand guest store dari API user data (sync server → client)
  React.useEffect(() => {
    if (userQuery.data) {
      hydrateGuest({
        menarcheDate: userQuery.data.menarcheDate,
        adatHaid: userQuery.data.adatHaid,
        adatSuci: userQuery.data.adatSuci,
        mustahadahCat: userQuery.data.mustahadahCat,
        isOnboarded: userQuery.data.isOnboarded,
        isGuest: userQuery.data.isGuest,
      });
    }
  }, [userQuery.data, hydrateGuest]);

  const statusQuery = useQuery<StatusData>({
    queryKey: ["status"],
    queryFn: async () => {
      const r = await fetch("/api/status", { cache: "no-store" });
      if (!r.ok) throw new Error("Gagal memuat status");
      return r.json();
    },
    refetchInterval: 60_000,
    enabled: !!userQuery.data?.isOnboarded,
  });

  const logsQuery = useQuery<BloodLogsData>({
    queryKey: ["blood-logs", 60],
    queryFn: async () => {
      const r = await fetch("/api/blood-logs?days=60", { cache: "no-store" });
      if (!r.ok) throw new Error("Gagal memuat catatan darah");
      return r.json();
    },
    enabled: !!userQuery.data?.isOnboarded,
  });

  const qadaQuery = useQuery<QadaData>({
    queryKey: ["qada"],
    queryFn: async () => {
      const r = await fetch("/api/qada", { cache: "no-store" });
      if (!r.ok) throw new Error("Gagal memuat qada");
      return r.json();
    },
    enabled: !!userQuery.data?.isOnboarded,
  });

  function refreshAll() {
    qc.invalidateQueries({ queryKey: ["user"] });
    qc.invalidateQueries({ queryKey: ["status"] });
    qc.invalidateQueries({ queryKey: ["blood-logs"] });
    qc.invalidateQueries({ queryKey: ["qada"] });
  }

  // ── Navigasi Guest (Catat digate → LoginDialog mandatory) ────────────────
  function handleNav(key: ScreenKey) {
    if (isGuest && key === "catat") {
      requestAction("catat");
      return;
    }
    setScreen(key);
  }

  function handleGoToCatat() {
    if (isGuest) {
      requestAction("catat");
      return;
    }
    setScreen("catat");
  }

  function handlePulseCatatClick() {
    if (isGuest) {
      requestAction("catat");
      return;
    }
    setScreen("catat");
  }

  // ── Seamless resume: setelah login, lanjutkan aksi yang ditahan ──────────
  /* eslint-disable react-hooks/set-state-in-effect -- koordinasi navigasi
     setelah alur async login→onboarding selesai (sinkron state eksternal). */
  React.useEffect(() => {
    if (authStatus !== "authenticated") return;
    if (!pendingAction) return;
    if (userQuery.isLoading || !userQuery.data) return;
    if (!userQuery.data.isOnboarded) {
      // User baru → OnboardingFlow dirender oleh gate di bawah;
      // pendingAction dipertahankan hingga onboarding selesai.
      return;
    }
    if (pendingAction === "catat") setScreen("catat");
    else if (pendingAction === "cek_kesucian") setCekOpen(true);
    setPendingAction(null);
  }, [authStatus, pendingAction, userQuery.data, userQuery.isLoading]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleOnboardingCompleted() {
    refreshAll();
    if (pendingAction === "catat") setScreen("catat");
    else if (pendingAction === "cek_kesucian") setCekOpen(true);
    setPendingAction(null);
  }

  // ── Loading session ──────────────────────────────────────────────────────
  if (authStatus === "loading") {
    return (
      <>
        <FullScreenLoader />
        <LoginDialog
          open={loginOpen}
          onOpenChange={setLoginOpen}
          mode={loginMode}
          onSuccess={handleLoginSuccess}
          onDismiss={markSeenInitial}
        />
      </>
    );
  }

  // ── Gate Onboarding (khusus user login yang belum selesai Onboarding) ────
  if (!isGuest) {
    if (userQuery.isLoading) {
      return (
        <>
          <FullScreenLoader />
          <LoginDialog
            open={loginOpen}
            onOpenChange={setLoginOpen}
            mode={loginMode}
            onSuccess={handleLoginSuccess}
            onDismiss={markSeenInitial}
          />
        </>
      );
    }
    if (userQuery.data && !userQuery.data.isOnboarded) {
      return (
        <>
          <OnboardingFlow
            initialData={{
              menarcheDate: userQuery.data.menarcheDate ?? "",
              adatHaid: userQuery.data.adatHaid,
              adatSuci: userQuery.data.adatSuci,
            }}
            onCompleted={handleOnboardingCompleted}
          />
          <LoginDialog
            open={loginOpen}
            onOpenChange={setLoginOpen}
            mode={loginMode}
            onSuccess={handleLoginSuccess}
            onDismiss={markSeenInitial}
          />
        </>
      );
    }
  }

  // ── Dashboard (guest dengan Default Adat, atau user sudah onboarding) ─────
  const isLoading =
    statusQuery.isLoading || logsQuery.isLoading;

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
  const mustahadahCat =
    userQuery.data?.mustahadahCat ?? MustahadahCategory.MUBTADAAH_MUMAYYIZAH;
  const effectiveAdatHaid = userQuery.data?.adatHaid ?? GUEST_DEFAULTS.adatHaid;
  const effectiveAdatSuci = userQuery.data?.adatSuci ?? GUEST_DEFAULTS.adatSuci;

  const loginDialog = (
    <LoginDialog
      open={loginOpen}
      onOpenChange={setLoginOpen}
      mode={loginMode}
      onSuccess={handleLoginSuccess}
      onDismiss={markSeenInitial}
    />
  );

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
            {/* Guest indicator — hanya untuk user belum login */}
            {isGuest && <SoftAuthBanner onLoginClick={() => requestLogin("mandatory")} />}

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
                    mustahadahCategory={mustahadahCat}
                    adatHaid={effectiveAdatHaid}
                    adatSuci={effectiveAdatSuci}
                    qadaPending={qadaPending}
                    qadaTotal={statusQuery.data?.qadaTotalCount ?? 0}
                    recentLogs={logsAsDomain.slice(0, 3)}
                    hasAnyLogs={logsAsDomain.length > 0}
                    onGoToCatat={handleGoToCatat}
                    isGuest={isGuest}
                  />
                )}

                {screen === "catat" && !isGuest && (
                  <BloodEntryForm onSaved={refreshAll} />
                )}
                {screen === "catat" && isGuest && (
                  <GuestGateCard
                    onLoginClick={() => requestLogin("mandatory")}
                  />
                )}

                {screen === "kalender" && (
                  <InteractiveCalendar logs={logsAsDomain} />
                )}

                {screen === "qada" &&
                  (isGuest ? (
                    <GuestGateCard
                      onLoginClick={() => requestLogin("mandatory")}
                      title="Qada dilindungi login"
                      description="Perhitungan Qada membutuhkan riwayat pendarahan Anda yang akurat. Masuk untuk melihat daftar salat yang wajib diqada."
                    />
                  ) : (
                    <QadaList
                      items={qadaItems}
                      onResolvedChange={() => refreshAll()}
                    />
                  ))}

                {screen === "profil" &&
                  (userQuery.data || isGuest ? (
                    <ProfilScreen
                      user={{
                        id: userQuery.data?.id ?? "",
                        uid: userQuery.data?.uid ?? "guest",
                        menarcheDate: userQuery.data?.menarcheDate ?? null,
                        adatHaid: effectiveAdatHaid,
                        adatSuci: effectiveAdatSuci,
                        mustahadahCat,
                        isOnboarded: userQuery.data?.isOnboarded ?? false,
                        isGuest,
                      }}
                      onSaved={refreshAll}
                      onLoginClick={() => requestLogin("mandatory")}
                    />
                  ) : null)}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </main>

      <BottomNav
        active={screen}
        onChange={handleNav}
        qadaPending={qadaPending}
      />

      {/* FAB "Catat Darah Keluar" dengan pulse — hanya untuk user baru (no BloodLog) */}
      <PulseCatatFAB
        visible={logsAsDomain.length === 0 && screen !== "catat"}
        onClick={handlePulseCatatClick}
      />

      <CekKesucianFAB
        open={cekOpen}
        onOpenChange={setCekOpen}
        isGuest={isGuest}
        onRequireLogin={() => requestAction("cek_kesucian")}
        onVerified={refreshAll}
      />

      {loginDialog}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Guest gate card — tampil saat Guest mencoba akses fitur yang dilindungi
// ──────────────────────────────────────────────────────────────────────────
function GuestGateCard({
  onLoginClick,
  title = "Fitur dilindungi login",
  description = "Data pendarahan Anda sangat penting. Silakan Login agar riwayat haid dan perhitungan Fikih Anda tersimpan aman dan akurat.",
}: {
  onLoginClick: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <Card className="border-dashed border-2 border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20">
      <CardContent className="px-4 py-8 flex flex-col items-center gap-3 text-center">
        <div className="size-14 rounded-full bg-gradient-to-br from-rose-500 to-pink-700 text-white flex items-center justify-center">
          <Lock className="size-7" aria-hidden />
        </div>
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            {description}
          </p>
        </div>
        <Button
          onClick={onLoginClick}
          className="bg-rose-600 hover:bg-rose-700 text-white min-h-[48px] px-6 gap-2 shadow-lg shadow-rose-500/30"
        >
          <PlusCircle className="size-5" />
          Masuk / Daftar
        </Button>
      </CardContent>
    </Card>
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
  isGuest: boolean;
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
  isGuest,
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
              {isGuest && (
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-2">
                  Anda sedang dalam <strong>Mode Tamu</strong> — data belum
                  tersimpan permanen. Login agar catatan Anda aman.
                </p>
              )}
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
