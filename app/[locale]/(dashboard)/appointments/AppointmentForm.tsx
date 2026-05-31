"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { APPT_TYPES, type ApptType, appointmentSchema } from "@/lib/validation/appointment";
import { APPT_TYPE_ICON } from "@/lib/appointmentIcons";
import { createAppointment, updateAppointment } from "./actions";
import type { Appointment } from "./AppointmentList";

const pad = (n: number) => String(n).padStart(2, "0");

// Tomorrow at 9:00 AM — the fast-path default for a new appointment.
function defaultDateTime() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: "09:00" };
}

// Stored ISO (UTC) → local date + time input values, for the edit prefill.
function toLocalInputs(iso: string) {
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

// Outer wrapper owns the Dialog; FormBody is remounted via `key` whenever the
// dialog opens or the target changes, so initial state is derived from props
// with lazy initializers — no setState-in-effect re-seeding.
export function AppointmentForm({
  open,
  onOpenChange,
  existing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: Appointment | null;
}) {
  const t = useTranslations("appointments");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? t("editTitle") : t("addTitle")}</DialogTitle>
        </DialogHeader>
        {open && (
          <FormBody
            key={existing?.id ?? "new"}
            existing={existing}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormBody({
  existing,
  onDone,
}: {
  existing: Appointment | null;
  onDone: () => void;
}) {
  const t = useTranslations("appointments");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Initial values derived once from props (lazy initializers) — edit prefills,
  // add gets the fast defaults (tomorrow 9:00, type "other").
  const initial = () => (existing ? toLocalInputs(existing.appt_at) : defaultDateTime());
  const [title, setTitle] = useState(existing?.title ?? "");
  const [date, setDate] = useState(() => initial().date);
  const [time, setTime] = useState(() => initial().time);
  const [apptType, setApptType] = useState<ApptType>(existing?.appt_type ?? "other");
  const [location, setLocation] = useState(existing?.location ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [moreOpen, setMoreOpen] = useState(Boolean(existing?.location || existing?.notes));
  const [error, setError] = useState<string | null>(null);

  const onSave = () => {
    if (!date || !time) {
      setError(t("errorWhen"));
      return;
    }
    // Combine local date + time → a real instant, store as UTC ISO.
    const apptAt = new Date(`${date}T${time}`);
    if (Number.isNaN(apptAt.getTime())) {
      setError(t("errorWhen"));
      return;
    }
    const input = {
      title,
      apptAt: apptAt.toISOString(),
      apptType,
      location,
      notes,
    };
    const parsed = appointmentSchema.safeParse(input);
    if (!parsed.success) {
      setError(t("errorTitle"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = existing
        ? await updateAppointment(existing.id, parsed.data)
        : await createAppointment(parsed.data);
      if (res.ok) {
        onDone();
        toast.success(existing ? t("updated") : t("added"));
        router.refresh();
      } else {
        toast.error(res.error === "no_case" ? t("errorNoCase") : t("error"));
      }
    });
  };

  return (
    <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="appt-title">{t("titleLabel")}</Label>
            <Input
              id="appt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              className="h-12 rounded-xl"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="appt-date">{t("dateLabel")}</Label>
              <Input
                id="appt-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appt-time">{t("timeLabel")}</Label>
              <Input
                id="appt-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">{t("typeLabel")}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {APPT_TYPES.map((type) => {
                const Icon = APPT_TYPE_ICON[type];
                const selected = apptType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setApptType(type)}
                    aria-pressed={selected}
                    className={cn(
                      "flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl px-2 text-sm font-medium transition",
                      selected
                        ? "border-2 border-primary bg-primary/10 text-foreground"
                        : "border border-border text-muted-foreground hover:border-primary/60",
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                    {t(`type.${type}`)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Optional detail — collapsed so the common case stays fast. */}
          <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="h-12 w-full justify-between px-4">
                <span>{t("moreToggle")}</span>
                <ChevronDown className={cn("h-5 w-5 transition-transform", moreOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="appt-location">{t("locationLabel")}</Label>
                <Input
                  id="appt-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("locationPlaceholder")}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appt-notes">{t("notesLabel")}</Label>
                <Textarea
                  id="appt-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder={t("notesPlaceholder")}
                  className="rounded-xl"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

      <Button type="button" onClick={onSave} disabled={pending} className="h-[56px] w-full text-base">
        {pending ? (
          <Loader2 className="h-5 w-5 motion-safe:animate-spin" aria-hidden />
        ) : existing ? (
          t("save")
        ) : (
          t("add")
        )}
      </Button>
    </div>
  );
}
