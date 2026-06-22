// src/lib/fiqh/constants.ts
//
// Konstanta fikih dari buku "Darah dalam Perempuan" — Khusnul Khotimah.
// Mazhab Syafi'i. Semua angka diambil HARFIAH dari spesifikasi.

import { ColorWeight, TraitWeight } from "./types";

// ──────────────────────────────────────────────────────────────────────────
// Hirarki warna darah (5 tingkat) — weight 5 = terkuat
// ──────────────────────────────────────────────────────────────────────────
export interface ColorSpec {
  weight: ColorWeight;
  label: string;
  hex: string; // dipakai untuk swatch di kalender & tombol
}

export const COLOR_HIERARCHY: ColorSpec[] = [
  { weight: ColorWeight.HITAM, label: "Hitam", hex: "#0a0a0a" },
  { weight: ColorWeight.MERAH, label: "Merah", hex: "#dc2626" },
  { weight: ColorWeight.COKELAT, label: "Cokelat", hex: "#92400e" },
  { weight: ColorWeight.KUNING, label: "Kuning", hex: "#eab308" },
  { weight: ColorWeight.KERUH, label: "Keruh", hex: "#d1d5db" },
];

export const COLOR_BY_WEIGHT: Record<number, ColorSpec> = Object.fromEntries(
  COLOR_HIERARCHY.map((c) => [c.weight, c]),
);

// ──────────────────────────────────────────────────────────────────────────
// Hirarki sifat darah (4 tingkat) — weight 4 = terkuat
// ──────────────────────────────────────────────────────────────────────────
export interface TraitSpec {
  weight: TraitWeight;
  label: string;
}

export const TRAIT_HIERARCHY: TraitSpec[] = [
  { weight: TraitWeight.KENTAL_BERBAU, label: "Kental & Berbau" },
  { weight: TraitWeight.KENTAL, label: "Kental" },
  { weight: TraitWeight.BERBAU, label: "Berbau" },
  { weight: TraitWeight.ENCER_TIDAK_BERBAU, label: "Encer & Tidak Berbau" },
];

export const TRAIT_BY_WEIGHT: Record<number, TraitSpec> = Object.fromEntries(
  TRAIT_HIERARCHY.map((t) => [t.weight, t]),
);

// ──────────────────────────────────────────────────────────────────────────
// Batas-batas Haid (Mazhab Syafi'i)
// ──────────────────────────────────────────────────────────────────────────
export const HAID_MIN_HOURS = 24; // pendarahan akumulatif minimal dalam 15 hari
export const HAID_MAX_DAYS = 15; // batas maksimal haid (15 hari 15 malam)
// CATATAN fiqih: Syafi'i menghitung "15 hari 15 malam" ≈ 360 jam penuh
// (15 × 24) ditambah margin malam. Secara praktis, doktrin "15 hari" dipakai
// sebagai cap kalender. Konstanta di bawah hanya untuk audit; perbandingan
// utama tetap memakai HAID_MAX_DAYS.
export const HAID_MAX_HOURS = 15 * 24 + 15; // 375 jam (15 hari + 15 jam malam)

// ──────────────────────────────────────────────────────────────────────────
// Batas-batas Suci antara dua haid
// ──────────────────────────────────────────────────────────────────────────
export const SUCI_MIN_DAYS = 15; // minimal 15 hari suci antara dua haid

// ──────────────────────────────────────────────────────────────────────────
// Batas-batas Nifas
// ──────────────────────────────────────────────────────────────────────────
export const NIFAS_MAX_DAYS = 60; // maksimal 60 hari, selebihnya istihadah
export const NIFAS_COMMON_DAYS = 40; // kebiasaan umum 40 hari

// ──────────────────────────────────────────────────────────────────────────
// Estimasi waktu salat (default Indonesia — placeholder, dapat ditimpa klien)
// Dipakai oleh qadaCalculator untuk menentukan apakah waktu salat sudah masuk
// dan masih tersisa cukup waktu untuk 1 rakaat (≥ 5 menit) atau takbiratul
// ihram (≥ 1 menit).
// ──────────────────────────────────────────────────────────────────────────
export interface PrayerTimeSpec {
  name: string;
  hour: number; // jam mulai (lokal)
  minute: number;
}

export const DEFAULT_PRAYER_TIMES: PrayerTimeSpec[] = [
  { name: "Subuh", hour: 4, minute: 40 },
  { name: "Zuhur", hour: 12, minute: 0 },
  { name: "Asar", hour: 15, minute: 15 },
  { name: "Magrib", hour: 18, minute: 0 },
  { name: "Isya", hour: 19, minute: 15 },
];

// Estimasi durasi satu waktu salat (jam). Dipakai untuk menghitung sisa waktu.
export const PRAYER_WINDOW_HOURS: Record<string, number> = {
  Subuh: 2.0, // ± 04:40 → 06:40
  Zuhur: 3.25, // 12:00 → 15:15
  Asar: 2.75, // 15:15 → 18:00
  Magrib: 1.25, // 18:00 → 19:15
  Isya: 9.5, // 19:15 → 04:40 (lintas hari)
};

// Threshold qada (menit) — apakah masih cukup waktu untuk 1 rakaat + bersuci
export const MIN_MINUTES_FOR_QADA_SKIP = 5;
// Threshold takbiratul ihram (menit) — apakah masih cukup waktu untuk takbir
export const MIN_MINUTES_FOR_TAKBIR = 1;
