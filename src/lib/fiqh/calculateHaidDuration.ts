// src/lib/fiqh/calculateHaidDuration.ts
//
// Menghitung durasi akumulatif pendarahan dalam window N hari terakhir.
// Aturan fikih (Mazhab Syafi'i, buku "Darah dalam Perempuan"):
//   - Minimal haid = 24 jam akumulatif dalam jendela 15 hari.
//   - Maksimal haid = 15 hari (15 hari 15 malam).
//   - Jika total < 24 jam dalam 15 hari → ISTIHADAH (bukan haid).
//
// Fungsi ini bersifat MURNI (tidak memanggil DB / tidak bermutasi).

import type { BloodLog } from "./types";
import { HAID_MIN_HOURS, HAID_MAX_DAYS } from "./constants";

export interface HaidDurationResult {
  totalHours: number;
  totalDays: number; // jumlah hari kalender unik yang menyentuh pendarahan
  isHaid: boolean; // true jika ≥ 24 jam
  isExceedsMax: boolean; // true jika rentang pendarangan > 15 hari
  reason: string;
}

/**
 * Hitung total jam pendarahan dalam `windowDays` hari terakhir.
 * - Untuk log dengan endTime null (masih berlangsung), gunakan `now`.
 * - Beberapa log boleh overlap; kita pakai pendekatan konservatif
 *   (penjumlahan sederhana sesuai spesifikasi: sum(end - start)).
 */
export function calculateHaidDuration(
  logs: BloodLog[],
  now: Date = new Date(),
  windowDays: number = HAID_MAX_DAYS,
): HaidDurationResult {
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const windowStart = new Date(now.getTime() - windowMs);

  // Filter log yang berada (seluruhnya/sebagian) dalam window.
  const inWindow = logs.filter((l) => {
    const end = l.endTime ?? now;
    return end >= windowStart && l.startTime <= now;
  });

  let totalMs = 0;
  const touchedDays = new Set<string>();

  for (const log of inWindow) {
    const start = log.startTime < windowStart ? windowStart : log.startTime;
    const end = log.endTime ?? now;
    if (end > start) totalMs += end.getTime() - start.getTime();

    // Tandai hari kalender yang tersentuh (untuk menghitung totalDays).
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const last = new Date(end);
    last.setHours(0, 0, 0, 0);
    while (cursor <= last) {
      touchedDays.add(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const totalHours = totalMs / (60 * 60 * 1000);
  const totalDays = touchedDays.size;
  const isHaid = totalHours >= HAID_MIN_HOURS;
  const isExceedsMax = totalDays > HAID_MAX_DAYS;

  let reason: string;
  if (inWindow.length === 0) {
    reason = "Tidak ada catatan pendarahan dalam 15 hari terakhir — diasumsikan SUCI.";
  } else if (totalHours < HAID_MIN_HOURS) {
    reason = `Total pendarahan ${totalHours.toFixed(1)} jam (< 24 jam) dalam ${totalDays} hari → ISTIHADAH (bukan haid).`;
  } else if (isExceedsMax) {
    reason = `Total ${totalDays} hari (> 15 hari maksimal) → perlu Tamayyiz untuk memisah Haid vs Istihadah.`;
  } else {
    reason = `Total pendarahan ${totalHours.toFixed(1)} jam selama ${totalDays} hari (≥ 24 jam & ≤ 15 hari) → HAID sah.`;
  }

  return { totalHours, totalDays, isHaid, isExceedsMax, reason };
}
