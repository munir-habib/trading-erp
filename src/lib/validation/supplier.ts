import { z } from "zod";

export const supplierStatusValues = [
  "ATIVO",
  "POTENCIAL",
  "INATIVO",
  "NUNCA_CONTACTADO",
] as const;

export const supplierSchema = z.object({
  name: z.string().min(1, "Indica o nome do fornecedor."),
  email: z.string().email().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  status: z.enum(supplierStatusValues).default("NUNCA_CONTACTADO"),
  driveLink: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  categoryIds: z.array(z.string()).default([]),
  certificationIds: z.array(z.string()).default([]),
  onBehalfOfId: z.string().optional().or(z.literal("")),
});

export const quickSupplierSchema = z.object({
  name: z.string().min(1, "Indica o nome do fornecedor."),
  contact: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
export type QuickSupplierInput = z.infer<typeof quickSupplierSchema>;
