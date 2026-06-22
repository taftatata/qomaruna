"use client";

import { motion } from "framer-motion";
import {
  Home,
  PlusCircle,
  CalendarDays,
  ListChecks,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ScreenKey = "beranda" | "catat" | "kalender" | "qada" | "profil";

interface NavItem {
  key: ScreenKey;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface BottomNavProps {
  active: ScreenKey;
  onChange: (key: ScreenKey) => void;
  qadaPending?: number;
}

export function BottomNav({ active, onChange, qadaPending = 0 }: BottomNavProps) {
  const items: NavItem[] = [
    { key: "beranda", label: "Beranda", icon: Home },
    { key: "catat", label: "Catat", icon: PlusCircle },
    { key: "kalender", label: "Kalender", icon: CalendarDays },
    {
      key: "qada",
      label: "Qada",
      icon: ListChecks,
      badge: qadaPending > 0 ? qadaPending : undefined,
    },
    { key: "profil", label: "Profil", icon: UserCircle },
  ];

  return (
    <nav
      aria-label="Navigasi utama"
      className={cn(
        "fixed bottom-0 inset-x-0 z-30",
        "border-t border-border/80",
        "bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/85",
        "shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.18)]",
        // safe-area iOS notch
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="mx-auto max-w-2xl grid grid-cols-5 h-16">
        {items.map((item) => {
          const isActive = active === item.key;
          const Icon = item.icon;
          return (
            <li key={item.key} className="flex">
              <button
                type="button"
                onClick={() => onChange(item.key)}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-0.5",
                  "min-h-[56px] transition-colors",
                  isActive
                    ? "text-rose-600"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute top-0 h-0.5 w-10 rounded-full bg-rose-600"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">
                  <Icon
                    className={cn(
                      "size-[22px] transition-transform",
                      isActive && "scale-110",
                    )}
                    aria-hidden
                  />
                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        "absolute -top-1.5 -right-2",
                        "inline-flex items-center justify-center",
                        "min-w-[18px] h-[18px] px-1 rounded-full",
                        "bg-destructive text-white text-[10px] font-bold",
                        "ring-2 ring-background",
                      )}
                      aria-label={`${item.badge} qada tertunggak`}
                    >
                      {item.badge}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none",
                    isActive && "font-semibold",
                  )}
                >
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
