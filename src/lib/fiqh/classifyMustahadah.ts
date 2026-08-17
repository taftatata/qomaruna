// src/lib/fiqh/classifyMustahadah.ts
//
// Mengklasifikasikan perempuan ke salah satu dari 7 kategori Mustahadah,
// lalu menerapkan algoritma Tamayyiz bila pendarahan melebihi 15 hari.
//
// Algoritma Tamayyiz (saat pendarahan > 15 hari):
//   - Sortir semua BloodLog episode berdasarkan:
//       colorWeight DESC, lalu traitWeight DESC.
//   - N hari terkuat (N = min(adatHaid, 15)) → diklasifikasikan HAID.
//   - Sisanya (yang lebih lemah) → ISTIHADAH.
//
// Aturan kategori:
//   1. Mubtada'ah Mumayyizah    — pertama kali, bisa membedakan → Tamayyiz.
//   2. Mubtada'ah Ghairu Mumayyizah — pertama kali, tidak bisa → adat (default 6).
//   3. Mu'tadah Mumayyizah      — punya adat, bisa bedakan → adat; jika lebih, Tamayyiz.
//   4. Mu'tadah Ghairu Mumayyizah — punya adat, tidak bisa → adat; sisanya istihadah.
//   5. Nafasah Mumayyizah       — nifas, bisa bedakan → ≤ 40 adat; > 40 gunakan Tamayyiz (cap 60).
//   6. Nafasah Ghairu Mumayyizah — nifas, tidak bisa → 40 hari; sisanya istihadah.
//   7. Mutahayyirah             — bingung/lupa adat → MASA IHTIYATH.

import {
  IbadahStatus,
  MustahadahCategory,
} from "./types";
import type { BloodLog, FiqhUser } from "./types";
import { calculateHaidDuration } from "./calculateHaidDuration";
import { HAID_MAX_DAYS, NIFAS_MAX_DAYS, NIFAS_COMMON_DAYS } from "./constants";

export interface ClassifyResult {
  category: MustahadahCategory;
  haidLogs: BloodLog[];
  istihadahLogs: BloodLog[];
  status: IbadahStatus;
  reason: string;
  totalHours: number;
  totalDays: number;
  isExceedsMax: boolean;
}

function isMumayyizah(cat: MustahadahCategory): boolean {
  return (
    cat === MustahadahCategory.MUBTADAAH_MUMAYYIZAH ||
    cat === MustahadahCategory.MUTADAH_MUMAYYIZAH ||
    cat === MustahadahCategory.NAFASAH_MUMAYYIZAH
  );
}

function isNifas(cat: MustahadahCategory): boolean {
  return (
    cat === MustahadahCategory.NAFASAH_MUMAYYIZAH ||
    cat === MustahadahCategory.NAFASAH_GHAIRU_MUMAYYIZAH
  );
}

/**
 * Klasifikasikan mustahadah & pisahkan log haid vs istihadah.
 */
export function classifyMustahadah(
  user: FiqhUser,
  logs: BloodLog[],
  now: Date = new Date(),
): ClassifyResult {
  const category = user.mustahadahCat;
  const dur = calculateHaidDuration(logs, now, HAID_MAX_DAYS, {
    adatHaid: user.adatHaid,
    adatSuci: user.adatSuci,
  });

  // ── KASUS KHUSUS: Mutahayyirah → semua MASA IHTIYATH ────────────────────
  if (category === MustahadahCategory.MUTAHAYYIRAH) {
    return {
      category,
      haidLogs: [],
      istihadahLogs: logs,
      status: IbadahStatus.MASA_IHTIYATH,
      reason:
        "Kategori Mutahayyirah: lupa adat haid. Status = MASA IHTIYATH. Wajib ihtiyath (berhati-hati) — anggap hari ambigu sebagai haid (tinggalkan salat) DAN qada setelahnya.",
      totalHours: dur.totalHours,
      totalDays: dur.totalDays,
      isExceedsMax: dur.isExceedsMax,
    };
  }

  // ── Tidak ada log → SUCI ─────────────────────────────────────────────────
  if (logs.length === 0 || dur.totalHours === 0) {
    return {
      category,
      haidLogs: [],
      istihadahLogs: [],
      status: IbadahStatus.SUCI,
      reason: "Belum ada catatan pendarahan. Status default: SUCI.",
      totalHours: 0,
      totalDays: 0,
      isExceedsMax: false,
    };
  }

  // Cap hari maksimal sesuai konteks (nifas 60, biasa 15).
  const maxDaysCap = isNifas(category) ? NIFAS_MAX_DAYS : HAID_MAX_DAYS;

  // ── Pendarahan < 24 jam → ISTIHADAH ─────────────────────────────────────
  if (!dur.isHaid) {
    return {
      category,
      haidLogs: [],
      istihadahLogs: logs,
      status: IbadahStatus.WAJIB_SALAT_ISTIHADAH,
      reason: `Total pendarahan ${dur.totalHours.toFixed(1)} jam (< 24 jam). Bukan haid → ISTIHADAH. Salat & puasa wajib, wajib wudu setiap keluar darah.`,
      totalHours: dur.totalHours,
      totalDays: dur.totalDays,
      isExceedsMax: false,
    };
  }

  // ── Pendarahan ≤ cap (15 atau 60) → semua haid ─────────────────────────
  if (dur.totalDays <= maxDaysCap) {
    return {
      category,
      haidLogs: logs,
      istihadahLogs: [],
      status: IbadahStatus.HARAM_IBADAH,
      reason: `Total ${dur.totalDays} hari (≤ ${maxDaysCap} hari batas maksimal ${isNifas(category) ? "nifas" : "haid"}). Seluruh pendarahan = HAID. Salat & puasa HARAM, wajib diqada setelah suci.`,
      totalHours: dur.totalHours,
      totalDays: dur.totalDays,
      isExceedsMax: false,
    };
  }

  // ── Pendarahan > cap → Terapkan Tamayyiz ────────────────────────────────
  const isMum = isMumayyizah(category);

  // Untuk Nafasah Ghairu Mumayyizah, default 40 hari (bukan adatHaid).
  // Untuk Nafasah Mumayyizah, adat = 40 (boleh di-tamayyiz hingga 60).
  let adatDays: number;
  if (isNifas(category)) {
    adatDays = isMum ? NIFAS_COMMON_DAYS : NIFAS_COMMON_DAYS;
  } else {
    adatDays = user.adatHaid;
  }
  // Cap adat ke batas maksimal (15 untuk haid, 60 untuk nifas).
  const haidDayCount = Math.min(adatDays, maxDaysCap);

  // Sortir log: colorWeight DESC, traitWeight DESC.
  const sorted = [...logs].sort((a, b) => {
    if (b.colorWeight !== a.colorWeight) return b.colorWeight - a.colorWeight;
    return b.traitWeight - a.traitWeight;
  });

  if (isMum) {
    // Mumayyizah: ambil N log terkuat sebagai haid, sisanya istihadah.
    const haidLogs = sorted.slice(0, haidDayCount);
    const istihadahLogs = sorted.slice(haidDayCount);
    return {
      category,
      haidLogs,
      istihadahLogs,
      status: IbadahStatus.HARAM_IBADAH, // masih dalam episode haid
      reason: `Pendarahan melebihi ${maxDaysCap} hari. Tamayyiz diterapkan: ${haidDayCount} log terkuat (warna+sifat) = HAID, ${istihadahLogs.length} log sisanya = ISTIHADAH. Hari istihadah → wajib salat & puasa, wajib wudu tiap darah.`,
      totalHours: dur.totalHours,
      totalDays: dur.totalDays,
      isExceedsMax: true,
    };
  }

  // Ghairu Mumayyizah: ambil N log pertama (kronologis) sebagai haid, sisanya istihadah.
  const chronoSorted = [...logs].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );
  const haidLogs = chronoSorted.slice(0, haidDayCount);
  const istihadahLogs = chronoSorted.slice(haidDayCount);
  return {
    category,
    haidLogs,
    istihadahLogs,
    status: IbadahStatus.HARAM_IBADAH,
    reason: `Pendarahan melebihi ${maxDaysCap} hari. Ghairu Mumayyizah → ${haidDayCount} hari pertama = HAID, ${istihadahLogs.length} log sisanya = ISTIHADAH.`,
    totalHours: dur.totalHours,
    totalDays: dur.totalDays,
    isExceedsMax: true,
  };
}
