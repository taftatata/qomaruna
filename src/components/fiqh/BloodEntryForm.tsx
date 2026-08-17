"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Droplets, Droplet, Wind, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  COLOR_HIERARCHY,
  TRAIT_HIERARCHY,
} from "@/lib/fiqh/constants";
import { ColorWeight, TraitWeight } from "@/lib/fiqh/types";

const TRAIT_ICONS: Record<number, React.ReactNode> = {
  [TraitWeight.KENTAL_BERBAU]: <Droplets className="size-4" aria-hidden />,
  [TraitWeight.KENTAL]: <Droplet className="size-4" aria-hidden />,
  [TraitWeight.BERBAU]: <Wind className="size-4" aria-hidden />,
  [TraitWeight.ENCER_TIDAK_BERBAU]: <Droplet className="size-4 opacity-50" aria-hidden />,
};

const formSchema = z
  .object({
    startTime: z.string().min(1, "Waktu mulai wajib diisi"),
    endTime: z.string().optional(),
    colorWeight: z.number().refine((v) => v >= 1 && v <= 5, {
      message: "Pilih salah satu warna darah",
    }),
    traitWeight: z.number().refine((v) => v >= 1 && v <= 4, {
      message: "Pilih salah satu sifat darah",
    }),
    note: z.string().max(280, "Catatan maksimal 280 karakter").optional(),
  })
  .refine(
    (d) => {
      if (!d.endTime) return true;
      return new Date(d.endTime).getTime() >= new Date(d.startTime).getTime();
    },
    { message: "Waktu selesai harus setelah waktu mulai", path: ["endTime"] },
  );

type FormValues = z.infer<typeof formSchema>;

function nowLocalInput(offsetMs = 0): string {
  const d = new Date(Date.now() + offsetMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

interface BloodEntryFormProps {
  onSaved: () => void;
}

export function BloodEntryForm({ onSaved }: BloodEntryFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startTime: nowLocalInput(),
      endTime: "",
      colorWeight: 0,
      traitWeight: 0,
      note: "",
    },
  });

  const { register, handleSubmit, watch, setValue, formState, reset } = form;
  const colorW = watch("colorWeight");
  const traitW = watch("traitWeight");

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const payload = {
        startTime: new Date(values.startTime).toISOString(),
        endTime: values.endTime
          ? new Date(values.endTime).toISOString()
          : null,
        colorWeight: values.colorWeight,
        traitWeight: values.traitWeight,
        isKapasPutih: false,
        note: values.note?.trim() || null,
      };
      const res = await fetch("/api/blood-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Gagal menyimpan" }));
        throw new Error(err.error || "Gagal menyimpan");
      }
      const data = await res.json();
      toast({
        title: "Catatan tersimpan",
        description: `Pendarahan ${data.log?.colorLabel} dicatat. ${
          data.newQadaEntries?.length
            ? `${data.newQadaEntries.length} qada baru tercatat.`
            : ""
        }`,
      });
      reset({
        startTime: nowLocalInput(),
        endTime: "",
        colorWeight: 0,
        traitWeight: 0,
        note: "",
      });
      onSaved();
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Catat Pendarahan</CardTitle>
        <CardDescription>
          Isi detail darah yang keluar. Pilih warna dan sifat sesuai yang
          Anda amati — dipakai untuk algoritma Tamayyiz.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
          aria-label="Form catat pendarahan"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="startTime">Waktu Mulai *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                {...register("startTime")}
              />
              {formState.errors.startTime && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {formState.errors.startTime.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="endTime">
                Waktu Selesai{" "}
                <span className="text-muted-foreground text-xs">
                  (kosongkan jika masih berlangsung)
                </span>
              </Label>
              <Input id="endTime" type="datetime-local" {...register("endTime")} />
              {formState.errors.endTime && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {formState.errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium mb-1">Warna Darah *</legend>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {COLOR_HIERARCHY.map((c) => {
                const selected = colorW === c.weight;
                return (
                  <button
                    key={c.weight}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setValue("colorWeight", c.weight, { shouldValidate: true })}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 min-h-[88px] transition-all",
                      selected
                        ? "border-primary bg-accent shadow-sm"
                        : "border-border hover:border-muted-foreground",
                    )}
                  >
                    <span
                      className="size-8 rounded-full border border-black/10"
                      style={{ backgroundColor: c.hex }}
                      aria-hidden
                    />
                    <span className="text-xs font-medium">{c.label}</span>
                    <Badge
                      variant="secondary"
                      className="absolute top-1 right-1 text-[10px] h-4 px-1"
                    >
                      w{c.weight}
                    </Badge>
                  </button>
                );
              })}
            </div>
            <input
              type="hidden"
              {...register("colorWeight")}
            />
            {formState.errors.colorWeight && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {formState.errors.colorWeight.message as string}
              </p>
            )}
          </fieldset>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium mb-1">Sifat Darah *</legend>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TRAIT_HIERARCHY.map((t) => {
                const selected = traitW === t.weight;
                return (
                  <button
                    key={t.weight}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setValue("traitWeight", t.weight, { shouldValidate: true })}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 min-h-[80px] transition-all",
                      selected
                        ? "border-primary bg-accent shadow-sm"
                        : "border-border hover:border-muted-foreground",
                    )}
                  >
                    <span className="text-muted-foreground" aria-hidden>
                      {TRAIT_ICONS[t.weight]}
                    </span>
                    <span className="text-xs font-medium text-center leading-tight">
                      {t.label}
                    </span>
                    <Badge
                      variant="secondary"
                      className="absolute top-1 right-1 text-[10px] h-4 px-1"
                    >
                      w{t.weight}
                    </Badge>
                  </button>
                );
              })}
            </div>
            <input
              type="hidden"
              {...register("traitWeight")}
            />
            {formState.errors.traitWeight && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {formState.errors.traitWeight.message as string}
              </p>
            )}
          </fieldset>

          <div className="grid gap-1.5">
            <Label htmlFor="note">Catatan (opsional)</Label>
            <Textarea
              id="note"
              placeholder="Misalnya: awal haid setelah Zuhur, darah merah kental berbau…"
              rows={3}
              maxLength={280}
              {...register("note")}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                reset({
                  startTime: nowLocalInput(),
                  endTime: "",
                  colorWeight: 0,
                  traitWeight: 0,
                  note: "",
                })
              }
              disabled={submitting}
            >
              Reset
            </Button>
            <Button type="submit" disabled={submitting} className="min-h-[44px]">
              {submitting ? "Menyimpan…" : "Simpan Catatan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
