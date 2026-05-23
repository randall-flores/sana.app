import { z } from "zod";

export const PAIN_LOCATIONS = [
  "neck",
  "upper_back",
  "lower_back",
  "shoulder",
  "arm",
  "hand_wrist",
  "hip",
  "leg",
  "knee",
  "foot_ankle",
  "head",
  "chest",
] as const;

export const PAIN_QUALITIES = [
  "sharp",
  "dull",
  "burning",
  "throbbing",
  "stiff",
  "numb_tingling",
] as const;

export const MOODS = ["okay", "anxious", "frustrated", "down", "exhausted"] as const;

export type PainLocation = (typeof PAIN_LOCATIONS)[number];
export type PainQuality = (typeof PAIN_QUALITIES)[number];
export type Mood = (typeof MOODS)[number];

export const journalEntrySchema = z.object({
  painLevel: z.number().int().min(1).max(10),
  notes: z.string().max(2000).optional(),
  painLocations: z.array(z.enum(PAIN_LOCATIONS)).optional(),
  painQuality: z.array(z.enum(PAIN_QUALITIES)).optional(),
  dailyImpact: z.string().max(1000).optional(),
  mood: z.enum(MOODS).optional(),
  medications: z.string().max(500).optional(),
});

export type JournalEntryInput = z.infer<typeof journalEntrySchema>;
