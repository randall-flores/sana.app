import { z } from "zod";

export const accidentTypeEnum = z.enum(["car", "slip", "other"]);
export const hasAttorneyEnum = z.enum(["yes", "not_yet", "not_sure"]);

export const onboardingSchema = z.object({
  accidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  accidentType: accidentTypeEnum,
  accidentDescription: z.string().max(2000).optional().default(""),
  painLevel: z.number().int().min(1).max(10),
  notes: z.string().max(4000).optional().default(""),
  hasAttorney: hasAttorneyEnum,
  attorneyFirmName: z.string().max(200).optional().default(""),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
