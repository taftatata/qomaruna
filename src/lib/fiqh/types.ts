// src/lib/fiqh/types.ts
//
// Tipe & enum inti untuk Sistem Pakar Fikih Wanita (Darah dalam Perempuan)
// Mengikuti Mazhab Syafi'i, buku "Darah dalam Perempuan" — Khusnul Khotimah.
//
// CATATAN: File ini sengaja TIDAK bergantung pada Prisma agar logic engine
// murni dapat di-unit-test dan dipakai baik di server (API) maupun klien.

// ──────────────────────────────────────────────────────────────────────────
// Bobot warna darah (Tamayyiz — hirarki warna, 1 = terlemah, 5 = terkuat)
// ──────────────────────────────────────────────────────────────────────────
export enum ColorWeight {
  KERUH = 1, // Cloudy
  KUNING = 2, // Yellow
  COKELAT = 3, // Brown
  MERAH = 4, // Red
  HITAM = 5, // Black
}

export const COLOR_LABELS: Record<ColorWeight, string> = {
  [ColorWeight.KERUH]: "Keruh",
  [ColorWeight.KUNING]: "Kuning",
  [ColorWeight.COKELAT]: "Cokelat",
  [ColorWeight.MERAH]: "Merah",
  [ColorWeight.HITAM]: "Hitam",
};

// ──────────────────────────────────────────────────────────────────────────
// Bobot sifat darah (Tamayyiz — hirarki sifat, 1 = terlemah, 4 = terkuat)
// ──────────────────────────────────────────────────────────────────────────
export enum TraitWeight {
  ENCER_TIDAK_BERBAU = 1, // Watery & Odorless
  BERBAU = 2, // Odorous
  KENTAL = 3, // Thick
  KENTAL_BERBAU = 4, // Thick & Odorous
}

export const TRAIT_LABELS: Record<TraitWeight, string> = {
  [TraitWeight.ENCER_TIDAK_BERBAU]: "Encer & Tidak Berbau",
  [TraitWeight.BERBAU]: "Berbau",
  [TraitWeight.KENTAL]: "Kental",
  [TraitWeight.KENTAL_BERBAU]: "Kental & Berbau",
};

// ──────────────────────────────────────────────────────────────────────────
// 7 Kategori Mustahadah (perempuan yang mengalami istihadah)
// ──────────────────────────────────────────────────────────────────────────
export enum MustahadahCategory {
  MUBTADAAH_MUMAYYIZAH = "MUBTADAAH_MUMAYYIZAH",
  MUBTADAAH_GHAIRU_MUMAYYIZAH = "MUBTADAAH_GHAIRU_MUMAYYIZAH",
  MUTADAH_MUMAYYIZAH = "MUTADAH_MUMAYYIZAH",
  MUTADAH_GHAIRU_MUMAYYIZAH = "MUTADAH_GHAIRU_MUMAYYIZAH",
  NAFASAH_MUMAYYIZAH = "NAFASAH_MUMAYYIZAH",
  NAFASAH_GHAIRU_MUMAYYIZAH = "NAFASAH_GHAIRU_MUMAYYIZAH",
  MUTAHAYYIRAH = "MUTAHAYYIRAH",
}

export const MUSTAHADAH_LABELS: Record<MustahadahCategory, string> = {
  [MustahadahCategory.MUBTADAAH_MUMAYYIZAH]: "Mubtada'ah Mumayyizah",
  [MustahadahCategory.MUBTADAAH_GHAIRU_MUMAYYIZAH]: "Mubtada'ah Ghairu Mumayyizah",
  [MustahadahCategory.MUTADAH_MUMAYYIZAH]: "Mu'tadah Mumayyizah",
  [MustahadahCategory.MUTADAH_GHAIRU_MUMAYYIZAH]: "Mu'tadah Ghairu Mumayyizah",
  [MustahadahCategory.NAFASAH_MUMAYYIZAH]: "Nafasah Mumayyizah",
  [MustahadahCategory.NAFASAH_GHAIRU_MUMAYYIZAH]: "Nafasah Ghairu Mumayyizah",
  [MustahadahCategory.MUTAHAYYIRAH]: "Mutahayyirah",
};

// ──────────────────────────────────────────────────────────────────────────
// Status ibadah (keluaran utama sistem pakar)
// ──────────────────────────────────────────────────────────────────────────
export enum IbadahStatus {
  HARAM_IBADAH = "HARAM_IBADAH", // Sedang haid/nifas → salat & puasa HARAM
  WAJIB_SALAT_ISTIHADAH = "WAJIB_SALAT_ISTIHADAH", // Istihadah → wajib salat/puasa, wudu tiap darah
  MASA_IHTIYATH = "MASA_IHTIYATH", // Mutahayyirah / belum jelas → ihtiyath
  SUCI = "SUCI", // Suci (hanya jika isKapasPutih=true)
}

// ──────────────────────────────────────────────────────────────────────────
// Nama salat (5 waktu)
// ──────────────────────────────────────────────────────────────────────────
export enum PrayerName {
  SUBUH = "Subuh",
  ZUHUR = "Zuhur",
  ASAR = "Asar",
  MAGRIB = "Magrib",
  ISYA = "Isya",
}

// ──────────────────────────────────────────────────────────────────────────
// Tipe data BloodLog (domain model, independen dari Prisma)
// ──────────────────────────────────────────────────────────────────────────
export interface BloodLog {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date | null; // null = masih berlangsung
  colorWeight: ColorWeight;
  colorLabel: string;
  traitWeight: TraitWeight;
  traitLabel: string;
  isKapasPutih: boolean;
  note?: string | null;
  createdAt: Date;
}

// ──────────────────────────────────────────────────────────────────────────
// Tipe data QadaEntry
// ──────────────────────────────────────────────────────────────────────────
export type QadaReason =
  | "AWAL_HAID"
  | "AKHIR_HAID_JAMAK"
  | "ISTIHADAH_TERTINGGAL"
  | "MANUAL";

export interface QadaEntry {
  id: string;
  userId: string;
  prayerName: PrayerName;
  prayerDate: Date;
  reason: QadaReason;
  isResolved: boolean;
  createdAt: Date;
}

// ──────────────────────────────────────────────────────────────────────────
// Tipe data User
// ──────────────────────────────────────────────────────────────────────────
export interface FiqhUser {
  id: string;
  uid: string;
  menarcheDate: Date | null;
  adatHaid: number; // hari
  adatSuci: number; // hari
  mustahadahCat: MustahadahCategory;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────────────────────────────────────────
// Hasil analisis episode (satu siklus pendarahan)
// ──────────────────────────────────────────────────────────────────────────
export interface EpisodeAnalysis {
  status: IbadahStatus;
  mustahadahCategory: MustahadahCategory;
  totalBleedingHours: number; // total jam pendarahan dalam 15 hari terakhir
  totalBleedingDays: number; // total hari (kalender) yang menyentuh pendarahan
  isHaidEpisode: boolean; // true jika dianggap haid (≥ 24 jam & ≤ 15 hari)
  isExceedsMaxDays: boolean; // true jika pendarahan > 15 hari
  haidLogs: BloodLog[]; // log yang diklasifikasikan sebagai haid (post-tamayyiz)
  istihadahLogs: BloodLog[]; // log yang diklasifikasikan sebagai istihadah
  reason: string; // penjelasan audit
  kapasVerified: boolean; // true jika isKapasPutih tercatat pada log terbaru
  instructions: string[]; // instruksi ibadah (jamak, qada, dll.)
  qadaToAdd: QadaEntry[]; // entri qada yang perlu disisipkan
}
