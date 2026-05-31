import { z } from "zod";

// Appointment types — tappable chips in the form, icon per type in the list.
export const APPT_TYPES = ["medical", "pt", "legal", "other"] as const;
export type ApptType = (typeof APPT_TYPES)[number];

export const appointmentSchema = z.object({
  title: z.string().trim().min(1).max(200),
  // ISO string (UTC) built from the local date + time pickers on the client.
  apptAt: z.string().min(1),
  apptType: z.enum(APPT_TYPES),
  location: z.string().max(300).optional(),
  notes: z.string().max(2000).optional(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;
