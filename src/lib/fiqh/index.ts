// src/lib/fiqh/index.ts
//
// Pintu ekspor tunggal untuk logic engine Sistem Pakar Fikih Wanita.

export * from "./types";
export * from "./constants";
export * from "./calculateHaidDuration";
export * from "./classifyMustahadah";
export * from "./qadaCalculator";

// Helper: konversi Prisma `BloodLog` (row DB) → domain `BloodLog` (logic engine).
import type { BloodLog as DomainBloodLog } from "./types";
import type { BloodLog as PrismaBloodLog } from "@prisma/client";

export function toDomainBloodLog(row: PrismaBloodLog): DomainBloodLog {
  return {
    id: row.id,
    userId: row.userId,
    startTime: row.startTime,
    endTime: row.endTime,
    colorWeight: row.colorWeight as DomainBloodLog["colorWeight"],
    colorLabel: row.colorLabel,
    traitWeight: row.traitWeight as DomainBloodLog["traitWeight"],
    traitLabel: row.traitLabel,
    isKapasPutih: row.isKapasPutih,
    note: row.note,
    createdAt: row.createdAt,
  };
}

// Helper: komposisi analisis penuh (dipakai oleh /api/status).
import type { FiqhUser, EpisodeAnalysis, QadaEntry } from "./types";
import { classifyMustahadah } from "./classifyMustahadah";
import { calculateQada } from "./qadaCalculator";
import { IbadahStatus } from "./types";

export function analyzeEpisode(
  user: FiqhUser,
  logs: DomainBloodLog[],
  existingQada: QadaEntry[] = [],
  now: Date = new Date(),
): EpisodeAnalysis {
  const cls = classifyMustahadah(user, logs, now);
  const qada = calculateQada(user, logs, existingQada, now);

  // Tentukan status akhir:
  //   - Jika kapasPutih tercatat pada log terbaru DAN tidak ada pendarahan
  //     aktif setelahnya → SUCI.
  //   - Jika tidak → ikuti klasifikasi.
  let status = cls.status;
  let kapasVerified = false;
  const sortedByStart = [...logs].sort(
    (a, b) => b.startTime.getTime() - a.startTime.getTime(),
  );
  const latest = sortedByStart[0];
  if (latest && latest.isKapasPutih) {
    kapasVerified = true;
    // Cek apakah ada pendarahan aktif (endTime null) atau log setelahnya.
    const hasActiveBleeding = logs.some((l) => l.endTime === null);
    if (!hasActiveBleeding) {
      status = IbadahStatus.SUCI;
    }
  }

  const reason = cls.reason + (kapasVerified ? " | Kapas putih terverifikasi." : "");

  return {
    status,
    mustahadahCategory: cls.category,
    totalBleedingHours: cls.totalHours,
    totalBleedingDays: cls.totalDays,
    isHaidEpisode: cls.isExceedsMax ? false : cls.haidLogs.length > 0,
    isExceedsMaxDays: cls.isExceedsMax,
    haidLogs: cls.haidLogs,
    istihadahLogs: cls.istihadahLogs,
    reason,
    kapasVerified,
    instructions: qada.instructions,
    qadaToAdd: qada.qadaToAdd,
  };
}
