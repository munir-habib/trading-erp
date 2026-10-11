"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { z } from "zod";

const shipmentSchema = z.object({
  forwarderId: z.string().optional().or(z.literal("")),
  freightCost: z.coerce.number().optional(),
  currency: z.enum(["EUR", "USD", "AOA"]).default("EUR"),
  departureEst: z.string().optional().or(z.literal("")),
  arrivalEst: z.string().optional().or(z.literal("")),
  departureReal: z.string().optional().or(z.literal("")),
  arrivalReal: z.string().optional().or(z.literal("")),
  finalCost: z.coerce.number().optional(),
});

export async function listForwarders() {
  return prisma.forwarder.findMany({ orderBy: { name: "asc" } });
}

export async function createForwarder(name: string) {
  await requireUser();
  const forwarder = await prisma.forwarder.create({ data: { name } });
  revalidatePath("/transitarios");
  return forwarder;
}

export async function getShipment(orderId: string) {
  return prisma.shipment.findUnique({
    where: { orderId },
    include: { forwarder: true },
  });
}

export async function getFreightThresholdPercent() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "freight_threshold_percent" },
  });
  return (setting?.value as number | undefined) ?? 15;
}

export async function upsertShipmentAction(orderId: string, formData: FormData) {
  await requireUser();
  const data = shipmentSchema.parse({
    forwarderId: formData.get("forwarderId"),
    freightCost: formData.get("freightCost") || undefined,
    currency: formData.get("currency") || "EUR",
    departureEst: formData.get("departureEst"),
    arrivalEst: formData.get("arrivalEst"),
    departureReal: formData.get("departureReal"),
    arrivalReal: formData.get("arrivalReal"),
    finalCost: formData.get("finalCost") || undefined,
  });

  await prisma.shipment.upsert({
    where: { orderId },
    update: {
      forwarderId: data.forwarderId || null,
      freightCost: data.freightCost ?? null,
      currency: data.currency,
      departureEst: data.departureEst ? new Date(data.departureEst) : null,
      arrivalEst: data.arrivalEst ? new Date(data.arrivalEst) : null,
      departureReal: data.departureReal ? new Date(data.departureReal) : null,
      arrivalReal: data.arrivalReal ? new Date(data.arrivalReal) : null,
      finalCost: data.finalCost ?? null,
    },
    create: {
      orderId,
      forwarderId: data.forwarderId || null,
      freightCost: data.freightCost ?? null,
      currency: data.currency,
      departureEst: data.departureEst ? new Date(data.departureEst) : null,
      arrivalEst: data.arrivalEst ? new Date(data.arrivalEst) : null,
      departureReal: data.departureReal ? new Date(data.departureReal) : null,
      arrivalReal: data.arrivalReal ? new Date(data.arrivalReal) : null,
      finalCost: data.finalCost ?? null,
    },
  });

  revalidatePath(`/pedidos/${orderId}`);
}

export async function setFreightThresholdAction(formData: FormData) {
  await requireUser();
  const percent = Number(formData.get("percent"));
  await prisma.systemSetting.upsert({
    where: { key: "freight_threshold_percent" },
    update: { value: percent },
    create: { key: "freight_threshold_percent", value: percent },
  });
  revalidatePath("/configuracoes");
}
