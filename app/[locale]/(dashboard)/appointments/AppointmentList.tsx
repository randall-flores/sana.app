"use client";

import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { CalendarPlus, ChevronDown, MapPin, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { friendlyDateTime, type FriendlyParts } from "@/lib/appointmentTime";
import { APPT_TYPE_ICON } from "@/lib/appointmentIcons";
import type { ApptType } from "@/lib/validation/appointment";
import { AppointmentForm } from "./AppointmentForm";
import { deleteAppointment } from "./actions";

export type Appointment = {
  id: string;
  title: string;
  appt_at: string;
  appt_type: ApptType;
  location: string;
  notes: string;
};

// Compose the localized friendly string from the parts (keeps "at"/"a las" and
// the relative day word in next-intl).
function friendlyLabel(
  parts: FriendlyParts,
  t: ReturnType<typeof useTranslations>,
): string {
  const at = t("at", { time: parts.timeStr });
  if (parts.day === "today") return `${t("today")} ${at}`;
  if (parts.day === "tomorrow") return `${t("tomorrow")} ${at}`;
  if (parts.day === "yesterday") return `${t("yesterday")} ${at}`;
  return `${parts.dateStr} ${at}`;
}

function Row({
  appt,
  now,
  onEdit,
  onDelete,
  dim,
}: {
  appt: Appointment;
  now: Date;
  onEdit: () => void;
  onDelete: () => void;
  dim?: boolean;
}) {
  const t = useTranslations("appointments");
  const locale = useLocale() as "en" | "es";
  const Icon = APPT_TYPE_ICON[appt.appt_type];
  const label = friendlyLabel(friendlyDateTime(appt.appt_at, now, locale), t);

  return (
    <Card
      className={cn(
        "rounded-2xl border-border/70 shadow-sm transition-shadow hover:shadow-md",
        dim && "opacity-70",
      )}
    >
      <CardContent className="flex items-center gap-2 p-2 pl-4">
        <button
          type="button"
          onClick={onEdit}
          aria-label={t("editAria", { title: appt.title })}
          className="flex min-h-[56px] min-w-0 flex-1 items-center gap-3 rounded-xl py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{appt.title}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span>{label}</span>
              {appt.location && (
                <>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                    <span className="truncate">{appt.location}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-12 w-12 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={t("delete")}
          onClick={onDelete}
        >
          <Trash2 className="h-5 w-5" aria-hidden />
        </Button>
      </CardContent>
    </Card>
  );
}

export function AppointmentList({ appointments }: { appointments: Appointment[] }) {
  const t = useTranslations("appointments");
  const router = useRouter();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [toDelete, setToDelete] = useState<Appointment | null>(null);
  const [pastOpen, setPastOpen] = useState(false);
  const [deleting, startDelete] = useTransition();

  // Date grouping/splitting depends on the local clock the server doesn't know —
  // render only after mount so SSR and client agree (no hydration drift).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { upcoming, past, now } = useMemo(() => {
    const n = new Date();
    const ms = n.getTime();
    const up: Appointment[] = [];
    const pa: Appointment[] = [];
    for (const a of appointments) {
      if (new Date(a.appt_at).getTime() >= ms) up.push(a);
      else pa.push(a);
    }
    up.sort((a, b) => new Date(a.appt_at).getTime() - new Date(b.appt_at).getTime()); // soonest first
    pa.sort((a, b) => new Date(b.appt_at).getTime() - new Date(a.appt_at).getTime()); // most recent first
    return { upcoming: up, past: pa, now: n };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, mounted]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (a: Appointment) => {
    setEditing(a);
    setFormOpen(true);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    startDelete(async () => {
      const res = await deleteAppointment(toDelete.id);
      if (res.ok) {
        setToDelete(null);
        toast.success(t("deleted"));
        router.refresh();
      } else {
        toast.error(t("deleteError"));
      }
    });
  };

  const addButton = (
    <Button type="button" onClick={openAdd} className="h-14 w-full gap-2 text-base sm:w-auto sm:px-8">
      <CalendarPlus className="h-5 w-5" aria-hidden />
      {t("add")}
    </Button>
  );

  if (!mounted) {
    return <div className="h-24 animate-pulse rounded-2xl bg-muted/40" aria-hidden />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-start">{addButton}</div>

      {appointments.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-border/70 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="rounded-2xl bg-primary/10 p-3">
              <CalendarPlus className="h-6 w-6 text-primary" aria-hidden />
            </span>
            <p className="max-w-xs text-balance text-muted-foreground">{t("empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
                {t("upcoming")}
              </h2>
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <Row
                    key={a.id}
                    appt={a}
                    now={now}
                    onEdit={() => openEdit(a)}
                    onDelete={() => setToDelete(a)}
                  />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <Collapsible open={pastOpen} onOpenChange={setPastOpen} className="space-y-3">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex min-h-[44px] w-full items-center justify-between text-sm font-semibold tracking-wide text-muted-foreground"
                >
                  {t("past", { count: past.length })}
                  <ChevronDown className={cn("h-4 w-4 transition-transform", pastOpen && "rotate-180")} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3">
                {past.map((a) => (
                  <Row
                    key={a.id}
                    appt={a}
                    now={now}
                    onEdit={() => openEdit(a)}
                    onDelete={() => setToDelete(a)}
                    dim
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </>
      )}

      <AppointmentForm open={formOpen} onOpenChange={setFormOpen} existing={editing} />

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirm", { title: toDelete?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className={cn(buttonVariants({ variant: "destructive" }), "h-11 px-4")}
            >
              {deleting ? t("deleting") : t("deleteCta")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
