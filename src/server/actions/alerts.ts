"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/session";
import { getVisibleAlert } from "@/lib/alerts";

export async function getCurrentAlert() {
  const user = await requireUser();
  return getVisibleAlert(user.id);
}

export async function dismissAlertAction(type: string, entityType: string, entityId: string) {
  const user = await requireUser();
  await prisma.alertDismissal.upsert({
    where: { type_entityType_entityId_userId: { type, entityType, entityId, userId: user.id } },
    update: { ignoredCount: { increment: 1 }, dismissedAt: new Date() },
    create: { type, entityType, entityId, userId: user.id, ignoredCount: 1 },
  });
  revalidatePath("/");
}

export async function snoozeAlertAction(type: string, entityType: string, entityId: string) {
  const user = await requireUser();
  const snoozedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.alertDismissal.upsert({
    where: { type_entityType_entityId_userId: { type, entityType, entityId, userId: user.id } },
    update: { snoozedUntil },
    create: { type, entityType, entityId, userId: user.id, snoozedUntil, ignoredCount: 0 },
  });
  revalidatePath("/");
}

export async function getAlertThresholds() {
  const [supplierDays, orderDays, freightPercent] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "supplier_stale_days" } }),
    prisma.systemSetting.findUnique({ where: { key: "order_stale_days" } }),
    prisma.systemSetting.findUnique({ where: { key: "freight_threshold_percent" } }),
  ]);
  return {
    supplierStaleDays: (supplierDays?.value as number | undefined) ?? 14,
    orderStaleDays: (orderDays?.value as number | undefined) ?? 7,
    freightThresholdPercent: (freightPercent?.value as number | undefined) ?? 15,
  };
}

export async function updateAlertThresholdsAction(formData: FormData) {
  await requireAdmin();
  const supplierStaleDays = Number(formData.get("supplierStaleDays"));
  const orderStaleDays = Number(formData.get("orderStaleDays"));
  const freightThresholdPercent = Number(formData.get("freightThresholdPercent"));

  await prisma.$transaction([
    prisma.systemSetting.upsert({
      where: { key: "supplier_stale_days" },
      update: { value: supplierStaleDays },
      create: { key: "supplier_stale_days", value: supplierStaleDays },
    }),
    prisma.systemSetting.upsert({
      where: { key: "order_stale_days" },
      update: { value: orderStaleDays },
      create: { key: "order_stale_days", value: orderStaleDays },
    }),
    prisma.systemSetting.upsert({
      where: { key: "freight_threshold_percent" },
      update: { value: freightThresholdPercent },
      create: { key: "freight_threshold_percent", value: freightThresholdPercent },
    }),
  ]);

  revalidatePath("/configuracoes");
}
