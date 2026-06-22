"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLOR_HIERARCHY, COLOR_BY_WEIGHT } from "@/lib/fiqh/constants";
import type { BloodLog } from "@/lib/fiqh/types";

interface InteractiveCalendarProps {
  logs: BloodLog[];
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const WEEKDAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function dateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface DayAggregate {
  date: Date;
  strongestColor: number; // weight terbesar di hari itu
  hasKapasPutih: boolean;
  logs: BloodLog[];
}

export function InteractiveCalendar({ logs }: InteractiveCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, DayAggregate>();
    for (const log of logs) {
      const key = dateKey(log.startTime);
      const existing = map.get(key);
      const strongest = existing
        ? Math.max(existing.strongestColor, log.colorWeight)
        : log.colorWeight;
      const hasKapas = existing
        ? existing.hasKapasPutih || log.isKapasPutih
        : log.isKapasPutih;
      const arr = existing ? existing.logs : [];
      arr.push(log);
      map.set(key, {
        date: new Date(log.startTime),
        strongestColor: strongest,
        hasKapasPutih: hasKapas,
        logs: arr,
      });
    }
    return map;
  }, [logs]);

  const grid = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startDayOfWeek = firstOfMonth.getDay(); // 0 = Min
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const selectedDay = selectedKey ? byDay.get(selectedKey) : undefined;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Kalender Pendarahan</CardTitle>
        <CardDescription>
          Setiap sel diwarnai sesuai warna darah terkuat hari itu. Tanda ✅ =
          tes kapas putih (suci terverifikasi).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Bulan sebelumnya" className="min-h-[44px] min-w-[44px]">
            <ChevronLeft className="size-4" />
          </Button>
          <div className="text-base sm:text-lg font-semibold">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </div>
          <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Bulan berikutnya" className="min-h-[44px] min-w-[44px]">
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs text-muted-foreground mb-1">
          {WEEKDAY_NAMES.map((d) => (
            <div key={d} className="font-medium py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {grid.map((date, idx) => {
            if (!date) return <div key={idx} className="aspect-square" />;
            const key = dateKey(date);
            const agg = byDay.get(key);
            const isToday =
              date.toDateString() === today.toDateString();
            const bgColor = agg
              ? COLOR_BY_WEIGHT[agg.strongestColor]?.hex ?? undefined
              : undefined;
            const isLight =
              agg && (agg.strongestColor <= 2); // kuning/keruh → teks gelap

            return (
              <button
                key={idx}
                type="button"
                onClick={() => agg && setSelectedKey(key)}
                disabled={!agg}
                aria-label={
                  agg
                    ? `${date.getDate()} ${MONTH_NAMES[viewMonth]} — ${COLOR_BY_WEIGHT[agg.strongestColor]?.label}${
                        agg.hasKapasPutih ? ", kapas putih terverifikasi" : ""
                      }`
                    : `${date.getDate()} ${MONTH_NAMES[viewMonth]} — tidak ada catatan`
                }
                className={cn(
                  "relative aspect-square rounded-md flex flex-col items-center justify-center text-sm transition-all",
                  agg
                    ? "hover:ring-2 hover:ring-primary cursor-pointer"
                    : "cursor-default text-muted-foreground/60",
                  isToday && "ring-2 ring-primary/60",
                )}
                style={bgColor ? { backgroundColor: bgColor } : undefined}
              >
                <span
                  className={cn(
                    "font-medium",
                    agg
                      ? isLight
                        ? "text-black"
                        : "text-white"
                      : "text-muted-foreground",
                  )}
                >
                  {date.getDate()}
                </span>
                {agg?.hasKapasPutih && (
                  <CheckCircle2
                    className="absolute -top-1 -right-1 size-4 text-emerald-500 bg-white rounded-full"
                    aria-label="Kapas putih"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs">
          {COLOR_HIERARCHY.map((c) => (
            <div key={c.weight} className="flex items-center gap-1.5">
              <span
                className="size-3 rounded-full border border-black/10"
                style={{ backgroundColor: c.hex }}
                aria-hidden
              />
              <span className="text-muted-foreground">
                {c.label} (w{c.weight})
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3 text-emerald-500" aria-hidden />
            <span className="text-muted-foreground">Kapas Putih</span>
          </div>
        </div>
      </CardContent>

      <Dialog open={!!selectedKey} onOpenChange={(o) => !o && setSelectedKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Detail Pendarahan{" "}
              {selectedDay
                ? `${selectedDay.date.getDate()} ${
                    MONTH_NAMES[selectedDay.date.getMonth()]
                  } ${selectedDay.date.getFullYear()}`
                : ""}
            </DialogTitle>
            <DialogDescription>
              {selectedDay
                ? `${selectedDay.logs.length} catatan pada hari ini. Warna terkuat: ${
                    COLOR_BY_WEIGHT[selectedDay.strongestColor]?.label
                  }.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
            {selectedDay?.logs.map((l) => (
              <div
                key={l.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <span
                  className="size-5 rounded-full border border-black/10 shrink-0 mt-0.5"
                  style={{ backgroundColor: COLOR_BY_WEIGHT[l.colorWeight]?.hex }}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    {l.colorLabel} • {l.traitLabel}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(l.startTime).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    →{" "}
                    {l.endTime
                      ? new Date(l.endTime).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "berlangsung"}
                  </div>
                  {l.note && (
                    <div className="text-xs italic mt-1 text-muted-foreground">
                      “{l.note}”
                    </div>
                  )}
                  {l.isKapasPutih && (
                    <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      Kapas putih terverifikasi
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
