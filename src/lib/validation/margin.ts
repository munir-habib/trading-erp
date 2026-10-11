import { z } from "zod";

export const orderMarginSchema = z.object({
  customPercentage: z.coerce.number().optional(),
  manualClientPrice: z.coerce.number().optional(),
  viewMode: z.enum(["SIMPLES", "COMPLETA"]).default("SIMPLES"),
});

export const marginRuleSchema = z.object({
  categoryId: z.string().optional().or(z.literal("")),
  percentage: z.coerce.number().min(0),
});
