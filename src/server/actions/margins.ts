"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { orderMarginSchema, marginRuleSchema } from "@/lib/validation/margin";

/** Custos fixos distribuídos (Visão Completa): quota simples = total de custos fixos / nº de pedidos criados este mês. */
async function fixedCostShare() {
  const [fixedCosts, ordersThisMonth] = await Promise.all([
    prisma.fixedCost.findMany(),
    prisma.order.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
  ]);
  const total = fixedCosts.reduce((sum, c) => sum + c.monthlyAmount, 0);
  return ordersThisMonth > 0 ? total / ordersThisMonth : 0;
}

export async function getOrderMarginData(orderId: string) {
  const [order, margin, defaultRule] = await Promise.all([
    prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: { include: { variant: { include: { product: true } } } } },
    }),
    prisma.orderMargin.findUnique({ where: { orderId } }),
    prisma.marginRule.findFirst({ where: { categoryId: null } }),
  ]);

  const categoryId = order.items.find((i) => i.variant?.product.categoryId)?.variant
    ?.product.categoryId;
  const categoryRule = categoryId
    ? await prisma.marginRule.findFirst({ where: { categoryId } })
    : null;

  const variableCost = order.items.reduce(
    (sum, i) => sum + (i.unitPrice ?? 0) * i.quantity,
    0,
  );
  const viewMode = margin?.viewMode ?? "SIMPLES";
  const share = viewMode === "COMPLETA" ? await fixedCostShare() : 0;
  const totalCost = variableCost + share;

  const effectivePercentage =
    margin?.customPercentage ?? categoryRule?.percentage ?? defaultRule?.percentage ?? 20;

  const suggestedPrice = totalCost * (1 + effectivePercentage / 100);
  const clientPrice = margin?.manualClientPrice ?? suggestedPrice;
  const realMarginPercent =
    clientPrice > 0 ? ((clientPrice - totalCost) / clientPrice) * 100 : 0;

  return {
    variableCost,
    fixedCostShare: share,
    totalCost,
    effectivePercentage,
    suggestedPrice,
    clientPrice,
    realMarginPercent,
    viewMode,
    manualClientPrice: margin?.manualClientPrice ?? null,
    customPercentage: margin?.customPercentage ?? null,
  };
}

export async function upsertOrderMarginAction(orderId: string, formData: FormData) {
  await requireAdmin();
  const data = orderMarginSchema.parse({
    customPercentage: formData.get("customPercentage") || undefined,
    manualClientPrice: formData.get("manualClientPrice") || undefined,
    viewMode: formData.get("viewMode") || "SIMPLES",
  });

  await prisma.orderMargin.upsert({
    where: { orderId },
    update: {
      customPercentage: data.customPercentage ?? null,
      manualClientPrice: data.manualClientPrice ?? null,
      viewMode: data.viewMode,
    },
    create: {
      orderId,
      customPercentage: data.customPercentage ?? null,
      manualClientPrice: data.manualClientPrice ?? null,
      viewMode: data.viewMode,
    },
  });

  revalidatePath(`/pedidos/${orderId}`);
}

export async function listMarginRules() {
  return prisma.marginRule.findMany({
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function upsertMarginRuleAction(formData: FormData) {
  await requireAdmin();
  const data = marginRuleSchema.parse({
    categoryId: formData.get("categoryId"),
    percentage: formData.get("percentage"),
  });

  await prisma.marginRule.create({
    data: { categoryId: data.categoryId || null, percentage: data.percentage },
  });

  revalidatePath("/configuracoes");
}
