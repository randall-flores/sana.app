import { z } from "zod";

export const updateNameSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
});

export const localeSchema = z.enum(["en", "es"]);

export type UpdateNameInput = z.infer<typeof updateNameSchema>;
