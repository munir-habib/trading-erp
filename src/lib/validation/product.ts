import { z } from "zod";

export const presentationTypeValues = [
  "BLISTER",
  "FRASCO",
  "INJETAVEL",
  "SUSPENSAO",
  "INDIVIDUAL",
] as const;

export const presentationSchema = z.object({
  id: z.string().optional(),
  type: z.enum(presentationTypeValues),
  dose: z.string().optional().or(z.literal("")),
  qtyPerPackage: z.coerce.number().int().min(1).default(1),
  unitsPerBox: z.coerce.number().int().min(1).default(1),
});

export const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Indica o nome da variante (ex: 5ml)."),
  sku: z.string().optional().or(z.literal("")),
  presentations: z.array(presentationSchema).default([]),
});

export const productSchema = z.object({
  name: z.string().min(1, "Indica o nome do produto."),
  genericName: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  imageUrl: z.string().optional().or(z.literal("")),
  variants: z.array(variantSchema).default([]),
});

export const commercialMappingSchema = z.object({
  commercialName: z.string().min(1, "Indica o nome comercial."),
  genericName: z.string().min(1, "Indica o nome genérico."),
});

export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
export type PresentationInput = z.infer<typeof presentationSchema>;
