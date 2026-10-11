"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function createCategory(name: string, riskLevel: "ALTO" | "MEDIO" | "BAIXO" = "BAIXO") {
  await requireUser();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Indica o nome da categoria.");

  const category = await prisma.category.upsert({
    where: { name: trimmed },
    update: {},
    create: { name: trimmed, riskLevel },
  });
  revalidatePath("/produtos");
  revalidatePath("/fornecedores");
  return category;
}

export async function listCertifications() {
  return prisma.certification.findMany({ orderBy: { name: "asc" } });
}

export async function createCertification(name: string) {
  await requireUser();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Indica o nome da certificação.");

  const certification = await prisma.certification.upsert({
    where: { name: trimmed },
    update: {},
    create: { name: trimmed },
  });
  revalidatePath("/fornecedores");
  return certification;
}
