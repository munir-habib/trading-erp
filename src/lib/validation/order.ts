import { z } from "zod";

export const orderStatusValues = [
  "PEDIDO_RECEBIDO",
  "EM_PROCUREMENT",
  "COTACAO_ENVIADA",
  "APROVADO",
  "EM_TRANSITO",
  "ENTREGUE",
  "NAO_AVANCOU",
] as const;

export const orderTypeValues = [
  "MEDICAMENTOS",
  "MATERIAL_CIRURGICO",
  "EQUIPAMENTO",
  "OUTRO",
] as const;

export const naoAvancouMotivoValues = [
  "PRECO",
  "PRAZO",
  "CLIENTE_DESISTIU",
  "PRODUTO_INDISPONIVEL",
  "CONCORRENCIA",
  "OUTRO",
] as const;

export const createOrderSchema = z.object({
  clientId: z.string().min(1, "Escolhe um cliente."),
  orderType: z.enum(orderTypeValues).default("OUTRO"),
  driveLink: z.string().optional().or(z.literal("")),
  onBehalfOfId: z.string().optional().or(z.literal("")),
});

export const orderItemSchema = z.object({
  variantId: z.string().optional().or(z.literal("")),
  freeTextProduct: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).default(1),
  supplierId: z.string().optional().or(z.literal("")),
  unitPrice: z.coerce.number().optional(),
  currency: z.enum(["EUR", "USD", "AOA"]).default("EUR"),
});

export const clientSchema = z.object({
  name: z.string().min(1, "Indica o nome do cliente."),
  email: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  driveLink: z.string().optional().or(z.literal("")),
});
