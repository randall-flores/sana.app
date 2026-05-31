import { Stethoscope, Dumbbell, Scale, CalendarDays, type LucideIcon } from "lucide-react";
import type { ApptType } from "@/lib/validation/appointment";

// One lucide icon per appointment type. Plain module (icon refs only, no hooks)
// — imported by the form, the list, and the dashboard card.
export const APPT_TYPE_ICON: Record<ApptType, LucideIcon> = {
  medical: Stethoscope,
  pt: Dumbbell,
  legal: Scale,
  other: CalendarDays,
};
