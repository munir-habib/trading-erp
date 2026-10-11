"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/session";
import { DEFAULT_CHECKLIST_ITEMS } from "@/lib/default-checklists";
import type { DocStatus, OrderType } from "@prisma/client";

export async function getOrCreateOrderDocuments(orderId: string, orderType: OrderType) {
  const existing = await prisma.orderDocument.findMany({
    where: { orderId },
    orderBy: { updatedAt: "asc" },
  });
  if (existing.length > 0) return existing;

  const template = await prisma.documentChecklistTemplate.findUnique({
    where: { orderType },
  });
  const items = (template?.items as string[] | undefined) ?? DEFAULT_CHECKLIST_ITEMS[orderType];

  await prisma.orderDocument.createMany({
    data: items.map((name) => ({ orderId, name })),
  });

  return prisma.orderDocument.findMany({ where: { orderId }, orderBy: { updatedAt: "asc" } });
}

export async function updateDocumentStatusAction(
  orderId: string,
  documentId: string,
  status: DocStatus,
) {
  await requireUser();
  await prisma.orderDocument.update({ where: { id: documentId }, data: { status } });
  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/pedidos");
}

export async function listChecklistTemplates() {
  return prisma.documentChecklistTemplate.findMany();
}

export async function upsertChecklistTemplateAction(formData: FormData) {
  await requireAdmin();
  const orderType = formData.get("orderType") as OrderType;
  const itemsRaw = formData.get("items") as string;
  const items = itemsRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.documentChecklistTemplate.upsert({
    where: { orderType },
    update: { items },
    create: { orderType, items },
  });

  revalidatePath("/configuracoes");
}

export async function listFaqArticles(status?: string) {
  const articles = await prisma.faqArticle.findMany({ orderBy: { title: "asc" } });
  if (!status) return articles;
  return articles.filter(
    (a) => a.appliesToStatuses.length === 0 || a.appliesToStatuses.includes(status as never),
  );
}

export async function upsertFaqArticleAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string | null;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const statuses = formData.getAll("appliesToStatuses") as string[];

  if (id) {
    await prisma.faqArticle.update({
      where: { id },
      data: { title, content, appliesToStatuses: statuses as never[] },
    });
  } else {
    await prisma.faqArticle.create({
      data: { title, content, appliesToStatuses: statuses as never[] },
    });
  }

  revalidatePath("/configuracoes");
  revalidatePath("/documentos");
}

export async function deleteFaqArticleAction(id: string) {
  await requireAdmin();
  await prisma.faqArticle.delete({ where: { id } });
  revalidatePath("/configuracoes");
  revalidatePath("/documentos");
}
