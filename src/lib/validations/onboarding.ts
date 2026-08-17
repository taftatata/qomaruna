// src/lib/validations/onboarding.ts
//
// Zod schemas untuk onboarding flow.
// Aturan fikih (Mazhab Syafi'i):
//   adatHaid  : 1-15 hari  (batas maksimal haid = 15 hari 15 malam)
//   adatSuci  : 15-30 hari (minimal jeda antar haid = 15 hari, tipikal 23-28)
//   menarche  : wajib, tidak boleh tanggal masa depan

import { z } from "zod";

export const onboardingSchema = z.object({
  menarcheDate: z
    .string()
    .min(1, "Tanggal menarche wajib diisi")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), {
      message: "Tanggal tidak valid",
    })
    .refine((v) => new Date(v).getTime() <= Date.now(), {
      message: "Tanggal menarche tidak boleh di masa depan",
    }),
  adatHaid: z
    .number()
    .int("Harus bilangan bulat")
    .min(1, "Minimal 1 hari")
    .max(15, "Maksimal 15 hari (Khamsata 'Asyar)"),
  adatSuci: z
    .number()
    .int("Harus bilangan bulat")
    .min(15, "Minimal 15 hari (jeda antar haid)")
    .max(30, "Maksimal 30 hari"),
  // Pertanyaan Step 3: "Apakah pendarahan Anda biasanya stabil atau sering berubah-ubah?"
  //   true  → sering berubah-ubah (Mubtadi'ah)
  //   false → stabil (Mu'tadah)
  isIrregularBleeding: z.boolean(),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;

// Step 2 saja (Input Adat)
export const adatStepSchema = onboardingSchema.pick({
  menarcheDate: true,
  adatHaid: true,
  adatSuci: true,
});

export type AdatStepValues = z.infer<typeof adatStepSchema>;

