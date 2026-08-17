// src/lib/stores/guest-store.ts
//
// Zustand store untuk guestData.
// Dipakai saat user belum login (isGuest=true) agar perhitungan LogicEngine
// tetap berjalan di sisi client menggunakan data sementara (tanpa harus kirim
// PATCH ke API dulu).
//
// Setelah user Daftar/Login (isGuest=false), data di store ini disinkronkan
// dengan Prisma dan store di-clear.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MustahadahCategory } from "@/lib/fiqh/types";

export interface GuestData {
  menarcheDate: string | null;
  adatHaid: number;
  adatSuci: number;
  mustahadahCat: MustahadahCategory;
  isOnboarded: boolean;
  isGuest: boolean;
}

interface GuestStore extends GuestData {
  // Setters
  setMenarcheDate: (v: string | null) => void;
  setAdatHaid: (v: number) => void;
  setAdatSuci: (v: number) => void;
  setMustahadahCat: (v: MustahadahCategory) => void;
  setIsOnboarded: (v: boolean) => void;
  setIsGuest: (v: boolean) => void;

  // Bulk hydrate — dipanggil saat data user dari API dimuat
  hydrate: (data: Partial<GuestData>) => void;

  // Reset — clear store setelah user login (data tersimpan di server)
  reset: () => void;
}

const DEFAULTS: GuestData = {
  menarcheDate: null,
  adatHaid: 6,
  adatSuci: 23,
  mustahadahCat: MustahadahCategory.MUBTADAAH_MUMAYYIZAH,
  isOnboarded: false,
  isGuest: true,
};

export const useGuestStore = create<GuestStore>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setMenarcheDate: (v) => set({ menarcheDate: v }),
      setAdatHaid: (v) => set({ adatHaid: v }),
      setAdatSuci: (v) => set({ adatSuci: v }),
      setMustahadahCat: (v) => set({ mustahadahCat: v }),
      setIsOnboarded: (v) => set({ isOnboarded: v }),
      setIsGuest: (v) => set({ isGuest: v }),

      hydrate: (data) =>
        set((state) => ({
          ...state,
          ...data,
        })),

      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: "fiqh-guest-data", // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Hanya persist data Adat & flags (bukan function setters)
      partialize: (state) => ({
        menarcheDate: state.menarcheDate,
        adatHaid: state.adatHaid,
        adatSuci: state.adatSuci,
        mustahadahCat: state.mustahadahCat,
        isOnboarded: state.isOnboarded,
        isGuest: state.isGuest,
      }),
    },
  ),
);

// Selector hook untuk ambil data Adat saja (untuk LogicEngine)
export function useGuestAdat() {
  return useGuestStore((s) => ({
    menarcheDate: s.menarcheDate,
    adatHaid: s.adatHaid,
    adatSuci: s.adatSuci,
    mustahadahCat: s.mustahadahCat,
    isOnboarded: s.isOnboarded,
    isGuest: s.isGuest,
  }));
}
