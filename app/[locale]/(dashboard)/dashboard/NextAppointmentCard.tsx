"use client";

import { useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarClock, ChevronRight, Plus } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { friendlyDateTime } from "@/lib/appointmentTime";
import { APPT_TYPE_ICON } from "@/lib/appointmentIcons";
import type { ApptType } from "@/lib/validation/appointment";

export type NextAppointment = {
  id: string;
  title: string;
  appt_at: string;
  appt_type: ApptType;
};

// "Your next appointment" — the single nearest upcoming one. This card surfacing
// it IS the reminder mechanism (no notifications by design). Friendly time is
// tz-dependent, so it renders only after mount.
export function NextAppointmentCard({ next }: { next: NextAppointment | null }) {
  const t = useTranslations("appointments");
  const locale = useLocale() as "en" | "es";

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [now] = useState(() => new Date());

  const label = () => {
    if (!next) return "";
    const p = friendlyDateTime(next.appt_at, now, locale);
    const at = t("at", { time: p.timeStr });
    if (p.day === "today") return `${t("today")} ${at}`;
    if (p.day === "tomorrow") return `${t("tomorrow")} ${at}`;
    if (p.day === "yesterday") return `${t("yesterday")} ${at}`;
    return `${p.dateStr} ${at}`;
  };

  const Icon = next ? APPT_TYPE_ICON[next.appt_type] : CalendarClock;

  return (
    <Card className="mt-6 rounded-2xl border-border/70 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <span className="rounded-2xl bg-primary/10 p-3">
          <CalendarClock className="h-6 w-6 text-primary" aria-hidden />
        </span>
        <CardTitle className="font-display text-lg font-semibold">{t("nextTitle")}</CardTitle>
      </CardHeader>

      <CardContent>
        {next ? (
          <Link
            href="/appointments"
            className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-5 w-5 text-primary" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{next.title}</p>
              {/* Reserve a line so the layout doesn't shift when the time appears post-mount. */}
              <p className="mt-0.5 text-xs text-muted-foreground">{mounted ? label() : " "}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        ) : (
          <Link
            href="/appointments"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t("emptyCardCta")}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
