"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  BookOpen,
  Sparkles,
  Loader2,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  onboardingSchema,
  type OnboardingValues,
} from "@/lib/validations/onboarding";
import { MustahadahCategory } from "@/lib/fiqh/types";

interface OnboardingFlowProps {
  initialData?: Partial<OnboardingValues>;
  onCompleted: () => void;
}

const TOTAL_STEPS = 3;

// ──────────────────────────────────────────────────────────────────────────
// Komponen utama
// ──────────────────────────────────────────────────────────────────────────
export function OnboardingFlow({
  initialData,
  onCompleted,
}: OnboardingFlowProps) {
  const { toast } = useToast();
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [isIrregular, setIsIrregular] = React.useState<boolean | null>(null);

  // Default values — pakai adat konservatif 6/23 hari, menarche kosong
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onTouched",
    defaultValues: {
      menarcheDate: initialData?.menarcheDate ?? "",
      adatHaid: initialData?.adatHaid ?? 6,
      adatSuci: initialData?.adatSuci ?? 23,
      isIrregularBleeding: false,
    },
  });

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    const values = form.getValues();
    values.isIrregularBleeding = isIrregular === true;

    const result = onboardingSchema.safeParse(values);
    if (!result.success) {
      const firstErr = result.error.issues[0];
      toast({
        title: "Validasi gagal",
        description: firstErr?.message ?? "Periksa kembali input Anda",
        variant: "destructive",
      });
      return;
    }

    if (isIrregular === null) {
      toast({
        title: "Pilih jawaban",
        description: "Tentukan apakah ini pertama kali pendarahan tidak teratur",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Klasifikasi awal:
      //   isIrregular=true  → MUBTADAAH_MUMAYYIZAH (Mubtadi'ah — pendarahan berubah-ubah)
      //   isIrregular=false → MUTADAH_MUMAYYIZAH  (Mu'tadah — pendarahan stabil)
      const mustahadahCat = isIrregular
        ? MustahadahCategory.MUBTADAAH_MUMAYYIZAH
        : MustahadahCategory.MUTADAH_MUMAYYIZAH;

      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menarcheDate: values.menarcheDate,
          adatHaid: values.adatHaid,
          adatSuci: values.adatSuci,
          mustahadahCat,
          isOnboarded: true,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan data onboarding");
      toast({
        title: "Onboarding selesai",
        description: `Adat Anda tersimpan. Kategori awal: ${
          isIrregular
            ? "Mubtadi'ah Mumayyizah (pendarahan berubah-ubah)"
            : "Mu'tadah Mumayyizah (pendarahan stabil)"
        }`,
      });
      onCompleted();
    } catch (e) {
      toast({
        title: "Gagal menyimpan",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-rose-50 via-background to-background dark:from-rose-950/20">
      {/* Header onboarding */}
      <header className="px-4 pt-6 pb-2">
        <div className="mx-auto max-w-md flex items-center gap-2">
          <div className="size-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-700 text-white flex items-center justify-center shrink-0">
            <Sparkles className="size-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold leading-tight">
              Onboarding Spesialis Fikih
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Darah dalam Perempuan · Mazhab Syafi&apos;i
            </p>
          </div>
        </div>
      </header>

      {/* Stepper indicator */}
      <div className="px-4 pt-2">
        <div className="mx-auto max-w-md flex items-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-rose-600" : "bg-muted",
              )}
              aria-label={`Step ${i + 1} ${i <= step ? "selesai" : "belum"}`}
            />
          ))}
        </div>
        <p className="mx-auto max-w-md text-center text-[11px] text-muted-foreground mt-1.5">
          Langkah {step + 1} dari {TOTAL_STEPS}
        </p>
      </div>

      {/* Content — AnimatePresence for slide-in */}
      <main className="flex-1 px-4 py-4 flex items-start justify-center">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {step === 0 && <Step1Education onNext={next} />}
              {step === 1 && (
                <Step2Adat
                  form={form}
                  onPrev={prev}
                  onNext={next}
                />
              )}
              {step === 2 && (
                <Step3Classification
                  isIrregular={isIrregular}
                  setIsIrregular={setIsIrregular}
                  onPrev={prev}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Step 1 — Khamsata 'Asyar (15 Hari) Education
// ──────────────────────────────────────────────────────────────────────────
function Step1Education({ onNext }: { onNext: () => void }) {
  return (
    <Card className="border-rose-200 dark:border-rose-900">
      <CardHeader className="pb-3">
        <Badge className="self-start bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          <BookOpen className="size-3 mr-1" />
          Edukasi
        </Badge>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="size-5 text-rose-600" />
          Khamsata &lsquo;Asyar (15 Hari)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-relaxed">
        <p>
          Dalam fikih wanita Mazhab Syafi&apos;i, batas maksimal masa haid
          adalah <strong>15 hari 15 malam</strong>. Pendarahan yang melebihi
          batas ini dianggap <em>istihadah</em> (pendarahan tidak normal), bukan
          haid.
        </p>
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-3 border border-rose-200 dark:border-rose-900">
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1">
            Tiga Syarat Utama Haid:
          </p>
          <ul className="text-xs space-y-1.5">
            <li className="flex gap-2">
              <span className="text-rose-600">•</span>
              <span>
                <strong>Minimal 24 jam</strong> akumulasi pendarahan dalam
                rentang 15 hari
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-rose-600">•</span>
              <span>
                <strong>Maksimal 15 hari 15 malam</strong>; selebihnya =
                istihadah
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-rose-600">•</span>
              <span>
                <strong>Jeda suci minimal 15 hari</strong> antar dua haid
              </span>
            </li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          Pada onboarding ini, Anda akan menginput <strong>Adat</strong>{" "}
          (kebiasaan siklus) agar sistem pakar dapat menghitung status ibadah
          Anda secara presisi.
        </p>

        {/* Nav */}
        <div className="pt-2">
          <Button
            type="button"
            onClick={onNext}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white min-h-[44px]"
          >
            Mulai Isi Adat <ChevronRight className="size-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Step 2 — Input Adat (menarcheDate, adatHaid, adatSuci)
// ──────────────────────────────────────────────────────────────────────────
function Step2Adat({
  form,
  onPrev,
  onNext,
}: {
  form: ReturnType<typeof useForm<OnboardingValues>>;
  onPrev: () => void;
  onNext: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const adatHaid = watch("adatHaid");
  const adatSuci = watch("adatSuci");

  // Validasi step 2 sebelum next
  function onValid() {
    onNext();
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="size-5 text-rose-600" />
          Input Adat (Kebiasaan Siklus)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onValid)}
          className="space-y-5"
          id="adat-form"
        >
          {/* menarcheDate */}
          <div className="space-y-1.5">
            <Label htmlFor="menarcheDate" className="text-xs">
              Tanggal Menarche (pertama kali haid)
            </Label>
            <Input
              id="menarcheDate"
              type="date"
              {...register("menarcheDate")}
              className={cn(errors.menarcheDate && "border-destructive")}
            />
            {errors.menarcheDate && (
              <p className="text-[11px] text-destructive">
                {errors.menarcheDate.message}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">
              Tanggal pertama kali Anda mengalami haid seumur hidup
            </p>
          </div>

          {/* adatHaid — Slider 1-15 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Adat Haid</Label>
              <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                {adatHaid} hari
              </Badge>
            </div>
            <Slider
              value={[adatHaid]}
              onValueChange={(v) => setValue("adatHaid", v[0], { shouldValidate: true })}
              min={1}
              max={15}
              step={1}
              className="py-2"
              aria-label="Adat Haid dalam hari"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1 hari (min)</span>
              <span>15 hari (maks · Khamsata &lsquo;Asyar)</span>
            </div>
            {errors.adatHaid && (
              <p className="text-[11px] text-destructive">
                {errors.adatHaid.message}
              </p>
            )}
          </div>

          {/* adatSuci — Slider 15-30 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Adat Suci</Label>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {adatSuci} hari
              </Badge>
            </div>
            <Slider
              value={[adatSuci]}
              onValueChange={(v) => setValue("adatSuci", v[0], { shouldValidate: true })}
              min={15}
              max={30}
              step={1}
              className="py-2"
              aria-label="Adat Suci dalam hari"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>15 hari (min jeda)</span>
              <span>30 hari (maks)</span>
            </div>
            {errors.adatSuci && (
              <p className="text-[11px] text-destructive">
                {errors.adatSuci.message}
              </p>
            )}
          </div>

          {/* Nav */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onPrev}
              className="flex-1 min-h-[44px]"
            >
              <ChevronLeft className="size-4 mr-1" /> Kembali
            </Button>
            <Button
              type="submit"
              form="adat-form"
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white min-h-[44px]"
            >
              Lanjut <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Step 3 — Klasifikasi Awal (Mubtada'ah vs Mu'tadah)
// ──────────────────────────────────────────────────────────────────────────
function Step3Classification({
  isIrregular,
  setIsIrregular,
  onPrev,
  onSubmit,
  submitting,
}: {
  isIrregular: boolean | null;
  setIsIrregular: (v: boolean) => void;
  onPrev: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="size-5 text-rose-600" />
          Klasifikasi Awal Mustahadah
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">
            Apakah pendarahan Anda biasanya stabil atau sering berubah-ubah?
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Jawaban ini menentukan kategori default Anda. Sistem akan menyempurnakan
            klasifikasi saat data pendarahan terkumpul (algoritma Tamayyiz).
          </p>
          <RadioGroup
            value={isIrregular === null ? "" : isIrregular ? "yes" : "no"}
            onValueChange={(v) => setIsIrregular(v === "yes")}
            className="space-y-2"
          >
            <Label
              htmlFor="r-no"
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                isIrregular === false
                  ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <RadioGroupItem value="no" id="r-no" className="mt-0.5" />
              <div>
                <p className="text-sm font-medium">
                  Stabil (Mu&apos;tadah)
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Durasi &amp; pola haid relatif konsisten antar siklus — sistem
                  akan pakai adat Anda sebagai acuan utama
                </p>
              </div>
            </Label>
            <Label
              htmlFor="r-yes"
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                isIrregular === true
                  ? "border-rose-600 bg-rose-50 dark:bg-rose-950/40"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <RadioGroupItem value="yes" id="r-yes" className="mt-0.5" />
              <div>
                <p className="text-sm font-medium">
                  Sering berubah-ubah (Mubtadi&apos;ah)
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Durasi &amp; pola haid tidak konsisten — sistem akan minta Anda
                  membedakan warna/sifat darah (Tamayyiz) untuk setiap episode
                </p>
              </div>
            </Label>
          </RadioGroup>
        </div>

        {/* Nav */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onPrev}
            disabled={submitting}
            className="flex-1 min-h-[44px]"
          >
            <ChevronLeft className="size-4 mr-1" /> Kembali
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white min-h-[44px]"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 mr-1 animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <Check className="size-4 mr-1" /> Selesai Onboarding
              </>
            )}
          </Button>
        </div>

        {/* Informasi penyimpanan — user sudah login saat menjalani onboarding */}
        <div className="mt-3 rounded-lg bg-muted/60 p-3 text-center">
          <p className="text-[11px] text-muted-foreground mb-2">
            Data Adat akan tersimpan di akun Anda dan digunakan untuk
            perhitungan LogicEngine secara akurat.
          </p>
          <p className="text-[10px] text-muted-foreground">
            Jika data terasa kurang tepat, Anda bisa mengubahnya kapan saja di
            tab <strong>Profil</strong>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
