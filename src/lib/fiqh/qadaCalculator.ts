// src/lib/fiqh/qadaCalculator.ts
//
// Menghitung entri Qada yang perlu disisipkan & instruksi ibadah berdasarkan
// aturan Awal Haid dan Akhir Haid (Mazhab Syafi'i, buku "Darah dalam Perempuan").
//
// AWAL HAID:
//   - Jika pendarahan dimulai SETELAH waktu salat masuk DAN masih tersisa
//     cukup waktu untuk 1 rakaat + bersuci (≥ 5 menit sebelum akhir waktu),
//     maka salat tersebut BELUM wajib ditinggalkan — tetapi wajib diqada
//     setelah suci.
//
// AKHIR HAID (hanya jika isKapasPutih === true):
//   - Jika kesucian dikonfirmasi DAN waktu salat berjalan masih punya cukup
//     waktu untuk takbiratul ihram (≥ 1 menit sebelum akhir), user WAJIB
//     segera salat.
//   - Boleh JAMAK dengan qada sebelumnya:
//       Asar  boleh jamak dengan qada Zuhur
//       Isya  boleh jamak dengan qada Magrib

import {
  type BloodLog,
  type FiqhUser,
  type QadaEntry,
  type QadaReason,
  PrayerName,
} from "./types";
import {
  DEFAULT_PRAYER_TIMES,
  MIN_MINUTES_FOR_QADA_SKIP,
  MIN_MINUTES_FOR_TAKBIR,
  PRAYER_WINDOW_HOURS,
  type PrayerTimeSpec,
} from "./constants";

export interface QadaCalcResult {
  qadaToAdd: QadaEntry[]; // entri baru yang harus disisipkan ke DB
  instructions: string[]; // instruksi manusiawi untuk ditampilkan
}

function minutesBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 60000;
}

interface PrayerWindow {
  start: Date; // mulai waktu salat (tanggal aktual)
  end: Date; // akhir waktu salat (tanggal aktual)
}

/**
 * Tentukan apakah `date` berada di dalam window waktu salat `p`. Jika ya,
 * kembalikan {start, end} tanggal aktual (untuk window yang melewati tengah
 * malam, start mungkin berada di hari sebelumnya).
 */
function getPrayerWindowForDate(
  date: Date,
  p: PrayerTimeSpec,
): PrayerWindow | null {
  const startMin = p.hour * 60 + p.minute;
  const windowHrs = PRAYER_WINDOW_HOURS[p.name] ?? 2;
  let endMin = startMin + Math.round(windowHrs * 60);
  let endDayOffset = 0;
  if (endMin >= 24 * 60) {
    endMin -= 24 * 60;
    endDayOffset = 1;
  }
  const minutesOfDay = date.getHours() * 60 + date.getMinutes();
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  // Cek window yang dimulai pada hari `date`:
  const startSameDay = new Date(dayStart);
  startSameDay.setHours(p.hour, p.minute, 0, 0);
  const endSameDay = new Date(dayStart);
  endSameDay.setDate(endSameDay.getDate() + endDayOffset);
  endSameDay.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);

  let inWindowSameDay: boolean;
  if (endDayOffset === 0) {
    inWindowSameDay = minutesOfDay >= startMin && minutesOfDay < endMin;
  } else {
    // Window melewati tengah malam. Pada `date`, window ini berjalan di
    // bagian sore-malam (menit-of-day >= startMin).
    inWindowSameDay = minutesOfDay >= startMin;
  }
  if (inWindowSameDay) return { start: startSameDay, end: endSameDay };

  // Cek window yang dimulai pada hari sebelumnya (untuk prayer lintas malam):
  if (endDayOffset === 1 && minutesOfDay < endMin) {
    const startPrev = new Date(dayStart);
    startPrev.setDate(startPrev.getDate() - 1);
    startPrev.setHours(p.hour, p.minute, 0, 0);
    const endPrev = new Date(startPrev);
    endPrev.setDate(endPrev.getDate() + 1);
    endPrev.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
    return { start: startPrev, end: endPrev };
  }

  return null;
}

/** Untuk waktu `now`, kembalikan window salat yang sedang berjalan (jika ada). */
function getCurrentPrayerWindow(now: Date): {
  name: PrayerName;
  prayerStart: Date;
  minutesLeft: number;
} | null {
  for (const p of DEFAULT_PRAYER_TIMES) {
    const w = getPrayerWindowForDate(now, p);
    if (w) {
      return {
        name: p.name as PrayerName,
        prayerStart: w.start,
        minutesLeft: minutesBetween(now, w.end),
      };
    }
  }
  return null;
}

/**
 * Hitung qada & instruksi.
 *
 * @param user         Data user
 * @param logs         Semua blood_log user
 * @param existingQada Daftar qada yang sudah ada di DB (untuk cek duplikat & jamak)
 * @param now          Tanggal referensi (default now)
 */
export function calculateQada(
  user: FiqhUser,
  logs: BloodLog[],
  existingQada: QadaEntry[] = [],
  now: Date = new Date(),
): QadaCalcResult {
  const qadaToAdd: QadaEntry[] = [];
  const instructions: string[] = [];

  const currentWindow = getCurrentPrayerWindow(now);

  // ── AWAL HAID: untuk setiap log, cek apakah startTime berada di dalam window
  // sebuah salat DAN masih ada ≥ 5 menit tersisa sebelum waktu salat berakhir.
  // Jika ya, salat tersebut wajib diqada.
  for (const log of logs) {
    for (const p of DEFAULT_PRAYER_TIMES) {
      const w = getPrayerWindowForDate(log.startTime, p);
      if (!w) continue;
      const minutesLeft = minutesBetween(log.startTime, w.end);
      if (minutesLeft < MIN_MINUTES_FOR_QADA_SKIP) continue;

      const name = p.name as PrayerName;
      // Cek duplikat
      const dup = existingQada.some(
        (q) =>
          q.prayerName === name &&
          q.prayerDate.toDateString() === w.start.toDateString() &&
          q.reason === "AWAL_HAID",
      );
      if (dup) continue;
      // Cek duplikat internal (log lain yang sudah menyebabkan qada yang sama)
      const dupPending = qadaToAdd.some(
        (q) =>
          q.prayerName === name &&
          q.prayerDate.toDateString() === w.start.toDateString(),
      );
      if (dupPending) continue;

      qadaToAdd.push({
        id: `pending-${user.id}-${name}-${w.start.toISOString()}`,
        userId: user.id,
        prayerName: name,
        prayerDate: w.start,
        reason: "AWAL_HAID" as QadaReason,
        isResolved: false,
        createdAt: new Date(),
      });
    }
  }

  // ── AKHIR HAID: cari log terbaru dengan isKapasPutih === true ──────────────
  const kapasLog = [...logs]
    .filter((l) => l.isKapasPutih)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];

  if (kapasLog && currentWindow) {
    const minutesLeft = currentWindow.minutesLeft;
    if (minutesLeft >= MIN_MINUTES_FOR_TAKBIR) {
      instructions.push(
        `✅ Suci dikonfirmasi (tes kapas putih). Segera laksanakan salat ${currentWindow.name} sekarang (sisa ${Math.round(minutesLeft)} menit).`,
      );
      const unresolved = existingQada.filter((q) => !q.isResolved);
      if (currentWindow.name === PrayerName.ASAR) {
        const hasQadaZuhur = unresolved.some(
          (q) => q.prayerName === PrayerName.ZUHUR,
        );
        if (hasQadaZuhur) {
          instructions.push(
            "📌 Boleh JAMAK TA'KHIR: kerjakan qada Zuhur bersama Asar (niat jamak takhir antara Zuhur & Asar).",
          );
        }
      } else if (currentWindow.name === PrayerName.ISYA) {
        const hasQadaMagrib = unresolved.some(
          (q) => q.prayerName === PrayerName.MAGRIB,
        );
        if (hasQadaMagrib) {
          instructions.push(
            "📌 Boleh JAMAK TA'KHIR: kerjakan qada Magrib bersama Isya (niat jamak takhir antara Magrib & Isya).",
          );
        }
      }
    }
  }

  if (qadaToAdd.length > 0) {
    instructions.push(
      `📋 ${qadaToAdd.length} entri qada baru terdeteksi (AWAL_HAID). Salat ini wajib diqada setelah suci.`,
    );
  }

  return { qadaToAdd, instructions };
}
