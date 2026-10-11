"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function listFixedCosts() {
  return prisma.fixedCost.findMany({ orderBy: { createdAt: "asc" } });
}

export async function createFixedCostAction(formData: FormData) {
  await requireAdmin();
  const name = formData.get("name") as string;
  const monthlyAmount = Number(formData.get("monthlyAmount"));
  const currency = (formData.get("currency") as "EUR" | "USD" | "AOA") || "EUR";

  await prisma.fixedCost.create({ data: { name, monthlyAmount, currency } });
  revalidatePath("/configuracoes");
}

export async function deleteFixedCostAction(id: string) {
  await requireAdmin();
  await prisma.fixedCost.delete({ where: { id } });
  revalidatePath("/configuracoes");
}
