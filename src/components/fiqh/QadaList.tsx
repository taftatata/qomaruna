"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QadaItem {
  id: string;
  prayerName: string;
  prayerDate: string; // ISO
  reason: string;
  isResolved: boolean;
}

interface QadaListProps {
  items: QadaItem[];
  onResolvedChange: (id: string, isResolved: boolean) => void;
}

const REASON_LABELS: Record<string, string> = {
  AWAL_HAID: "Awal Haid (tertimpa waktu salat)",
  AKHIR_HAID_JAMAK: "Akhir Haid (jamak)",
  ISTIHADAH_TERTINGGAL: "Istihadah tertinggal",
  MANUAL: "Manual",
};

export function QadaList({ items, onResolvedChange }: QadaListProps) {
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const unresolved = items.filter((q) => !q.isResolved);
  const resolved = items.filter((q) => q.isResolved);

  async function toggle(item: QadaItem) {
    setPendingId(item.id);
    try {
      const res = await fetch(`/api/qada/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResolved: !item.isResolved }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui");
      onResolvedChange(item.id, !item.isResolved);
      toast({
        title: item.isResolved
          ? "Ditandai tertunggak kembali"
          : "Qada selesai",
        description: `Salat ${item.prayerName} — ${
          REASON_LABELS[item.reason] ?? item.reason
        }`,
      });
    } catch (e) {
      toast({
        title: "Gagal memperbarui",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Daftar Qada</CardTitle>
        <CardDescription>
          Salat yang wajib diqada setelah suci. Centang kotak untuk menandai
          sudah dikerjakan.
        </CardDescription>
        <div className="flex flex-wrap gap-2 mt-1">
          <Badge variant="destructive" className="gap-1">
            <Clock3 className="size-3" /> {unresolved.length} tertunggak
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="size-3 text-emerald-600" />
            {resolved.length} selesai
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Belum ada entri qada. Akan muncul otomatis saat sistem mendeteksi
            awal haid yang menimpa waktu salat.
          </div>
        ) : (
          <ScrollArea className="max-h-[420px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[44px]">Selesai</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Salat</TableHead>
                  <TableHead className="hidden sm:table-cell">Alasan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((q) => (
                  <TableRow
                    key={q.id}
                    className={cn(
                      q.isResolved && "opacity-60",
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={q.isResolved}
                        disabled={pendingId === q.id}
                        onCheckedChange={() => toggle(q)}
                        aria-label={`Tandai qada ${q.prayerName} selesai`}
                      />
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {new Date(q.prayerDate).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{q.prayerName}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {REASON_LABELS[q.reason] ?? q.reason}
                    </TableCell>
                    <TableCell>
                      {q.isResolved ? (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          Selesai
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Tertunggak</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
