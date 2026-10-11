"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function createComparisonAction(formData: FormData) {
  const user = await requireUser();
  const orderId = formData.get("orderId") as string | null;
  const comparison = await prisma.comparison.create({
    data: {
      orderId: orderId || null,
      createdById: user.id,
    },
  });

  await logAudit({
    entityType: "Comparison",
    entityId: comparison.id,
    action: "CREATE",
    actorId: user.id,
  });

  revalidatePath("/comparacoes");
  redirect(`/comparacoes/${comparison.id}`);
}

export async function listComparisons() {
  return prisma.comparison.findMany({
    include: {
      order: { select: { reference: true } },
      createdBy: { select: { name: true } },
      rows: { select: { id: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getComparison(id: string) {
  return prisma.comparison.findUnique({
    where: { id },
    include: {
      order: { select: { id: true, reference: true } },
      createdBy: { select: { name: true } },
      onBehalfOf: { select: { name: true } },
      rows: {
        orderBy: { position: "asc" },
        include: {
          variant: {
            include: {
              product: { include: { category: true } },
              presentations: true,
            },
          },
          cells: {
            include: {
              supplier: { include: { evaluations: true } },
            },
          },
        },
      },
    },
  });
}

export async function addComparisonRowAction(
  comparisonId: string,
  data: { variantId?: string; freeTextProduct?: string },
) {
  await requireUser();
  const comparison = await prisma.comparison.findUniqueOrThrow({
    where: { id: comparisonId },
    include: { rows: { select: { id: true, cells: { select: { supplierId: true } } } } },
  });

  const supplierIds = new Set<string>();
  for (const row of comparison.rows) {
    for (const cell of row.cells) supplierIds.add(cell.supplierId);
  }

  await prisma.comparisonRow.create({
    data: {
      comparisonId,
      variantId: data.variantId || null,
      freeTextProduct: data.variantId ? null : data.freeTextProduct || null,
      position: comparison.rows.length,
      cells: {
        create: Array.from(supplierIds).map((supplierId) => ({ supplierId })),
      },
    },
  });

  await prisma.comparison.update({ where: { id: comparisonId }, data: {} });
  revalidatePath(`/comparacoes/${comparisonId}`);
}

export async function removeComparisonRowAction(comparisonId: string, rowId: string) {
  await requireUser();
  await prisma.comparisonRow.delete({ where: { id: rowId } });
  revalidatePath(`/comparacoes/${comparisonId}`);
}

export async function addComparisonSupplierAction(
  comparisonId: string,
  supplierId: string,
) {
  await requireUser();
  const rows = await prisma.comparisonRow.findMany({
    where: { comparisonId },
    select: { id: true, cells: { select: { supplierId: true } } },
  });

  const toCreate = rows.filter(
    (row) => !row.cells.some((c) => c.supplierId === supplierId),
  );

  await prisma.$transaction(
    toCreate.map((row) =>
      prisma.comparisonCell.create({ data: { rowId: row.id, supplierId } }),
    ),
  );

  revalidatePath(`/comparacoes/${comparisonId}`);
}

export async function removeComparisonSupplierAction(
  comparisonId: string,
  supplierId: string,
) {
  await requireUser();
  await prisma.comparisonCell.deleteMany({
    where: { supplierId, row: { comparisonId } },
  });
  revalidatePath(`/comparacoes/${comparisonId}`);
}

export async function updateComparisonCellAction(
  comparisonId: string,
  cellId: string,
  data: {
    pricePerBox?: number | null;
    currency?: "EUR" | "USD" | "AOA";
    quoteExpiresAt?: string | null;
    presentationNote?: string | null;
  },
) {
  await requireUser();
  const cell = await prisma.comparisonCell.update({
    where: { id: cellId },
    data: {
      pricePerBox: data.pricePerBox,
      currency: data.currency,
      quoteExpiresAt: data.quoteExpiresAt ? new Date(data.quoteExpiresAt) : data.quoteExpiresAt === null ? null : undefined,
      presentationNote: data.presentationNote,
    },
    include: { row: true },
  });

  if (data.pricePerBox != null && cell.row.variantId) {
    await prisma.priceHistory.create({
      data: {
        variantId: cell.row.variantId,
        supplierId: cell.supplierId,
        pricePerBox: data.pricePerBox,
        currency: data.currency ?? cell.currency,
      },
    });
  }

  await prisma.comparison.update({ where: { id: comparisonId }, data: {} });

  revalidatePath(`/comparacoes/${comparisonId}`);
}

export async function toggleAwardAction(
  comparisonId: string,
  rowId: string,
  supplierId: string,
) {
  const user = await requireUser();
  const cells = await prisma.comparisonCell.findMany({ where: { rowId } });
  const target = cells.find((c) => c.supplierId === supplierId);
  if (!target) return;

  const nowAwarded = !target.isAwarded;

  await prisma.$transaction([
    ...cells.map((c) =>
      prisma.comparisonCell.update({
        where: { id: c.id },
        data: { isAwarded: c.id === target.id ? nowAwarded : false },
      }),
    ),
  ]);

  await logAudit({
    entityType: "Comparison",
    entityId: comparisonId,
    action: "UPDATE",
    actorId: user.id,
    note: nowAwarded ? "Adjudicação registada." : "Adjudicação removida.",
  });

  revalidatePath(`/comparacoes/${comparisonId}`);
}

export async function applyAwardsToOrderAction(comparisonId: string) {
  const user = await requireUser();
  const comparison = await prisma.comparison.findUniqueOrThrow({
    where: { id: comparisonId },
    include: { rows: { include: { cells: true } } },
  });
  if (!comparison.orderId) throw new Error("Esta comparação não está associada a um pedido.");

  for (const row of comparison.rows) {
    const awarded = row.cells.find((c) => c.isAwarded);
    if (!awarded) continue;

    await prisma.orderItem.create({
      data: {
        orderId: comparison.orderId,
        variantId: row.variantId,
        freeTextProduct: row.variantId ? null : row.freeTextProduct,
        quantity: 1,
        supplierId: awarded.supplierId,
        unitPrice: awarded.pricePerBox,
        currency: awarded.currency,
      },
    });
  }

  await prisma.comparison.update({
    where: { id: comparisonId },
    data: { status: "COMPLETED" },
  });

  await logAudit({
    entityType: "Comparison",
    entityId: comparisonId,
    action: "UPDATE",
    actorId: user.id,
    note: "Adjudicação aplicada ao pedido.",
  });

  revalidatePath(`/comparacoes/${comparisonId}`);
  revalidatePath(`/pedidos/${comparison.orderId}`);
}
