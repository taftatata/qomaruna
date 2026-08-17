"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, UserCircle, CalendarDays, ListChecks } from "lucide-react";
import { MUSTAHADAH_LABELS, MustahadahCategory } from "@/lib/fiqh/types";

interface StatsCardsProps {
  totalBleedingHours: number;
  totalBleedingDays: number;
  mustahadahCategory: MustahadahCategory;
  adatHaid: number;
  adatSuci: number;
  qadaPending: number;
  qadaTotal: number;
}

export function StatsCards({
  totalBleedingHours,
  totalBleedingDays,
  mustahadahCategory,
  adatHaid,
  adatSuci,
  qadaPending,
  qadaTotal,
}: StatsCardsProps) {
  const stats = [
    {
      icon: <Clock className="size-5 text-rose-600" aria-hidden />,
      label: "Total Pendarahan",
      value: `${totalBleedingHours.toFixed(1)} jam`,
      sub: `dalam ${totalBleedingDays} hari (15 hari)`,
    },
    {
      icon: <UserCircle className="size-5 text-emerald-600" aria-hidden />,
      label: "Kategori Mustahadah",
      value: MUSTAHADAH_LABELS[mustahadahCategory] ?? mustahadahCategory,
      sub: "klasifikasi fikih",
    },
    {
      icon: <CalendarDays className="size-5 text-amber-600" aria-hidden />,
      label: "Adat Haid / Suci",
      value: `${adatHaid} / ${adatSuci} hari`,
      sub: "rata-rata siklus",
    },
    {
      icon: <ListChecks className="size-5 text-violet-600" aria-hidden />,
      label: "Qada Tertunggak",
      value: `${qadaPending} salat`,
      sub: `dari ${qadaTotal} total entri`,
    },
  ];

  return (
    <section
      aria-label="Statistik ibadah"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full"
    >
      {stats.map((s, i) => (
        <Card key={i} className="py-4 gap-2">
          <CardContent className="px-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {s.label}
              </span>
              {s.icon}
            </div>
            <div className="text-lg sm:text-xl font-bold leading-tight">
              {s.value}
            </div>
            <div className="text-[11px] sm:text-xs text-muted-foreground">
              {s.sub}
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
