"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { getOrCreateOrderDocuments } from "@/server/actions/documents";
import {
  createOrderSchema,
  orderItemSchema,
  orderStatusValues,
  naoAvancouMotivoValues,
} from "@/lib/validation/order";
import type { OrderStatus } from "@prisma/client";

async function generateReference() {
  const year = new Date().getFullYear();
  const count = await prisma.order.count({
    where: { reference: { startsWith: `PED-${year}-` } },
  });
  return `PED-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function createOrderAction(formData: FormData) {
  const user = await requireUser();
  const data = createOrderSchema.parse({
    clientId: formData.get("clientId"),
    orderType: formData.get("orderType") || "OUTRO",
    driveLink: formData.get("driveLink"),
    onBehalfOfId: formData.get("onBehalfOfId"),
  });
  const onBehalfOfId =
    user.role === "ADMIN" && data.onBehalfOfId ? data.onBehalfOfId : null;

  const reference = await generateReference();

  const order = await prisma.order.create({
    data: {
      reference,
      clientId: data.clientId,
      orderType: data.orderType,
      driveLink: data.driveLink || null,
      createdById: user.id,
      onBehalfOfId,
      statusHistory: {
        create: { toStatus: "PEDIDO_RECEBIDO", changedById: user.id },
      },
    },
  });

  await logAudit({
    entityType: "Order",
    entityId: order.id,
    action: "CREATE",
    actorId: user.id,
    onBehalfOfId,
    changes: { reference },
  });

  await getOrCreateOrderDocuments(order.id, data.orderType);

  revalidatePath("/pedidos");
  redirect(`/pedidos/${order.id}`);
}

export async function listOrdersForKanban() {
  const orders = await prisma.order.findMany({
    include: {
      client: { select: { name: true } },
      createdBy: { select: { name: true } },
      onBehalfOf: { select: { name: true } },
      items: { select: { id: true, variant: { select: { name: true } }, freeTextProduct: true } },
      documents: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const columns: Record<OrderStatus, typeof orders> = {
    PEDIDO_RECEBIDO: [],
    EM_PROCUREMENT: [],
    COTACAO_ENVIADA: [],
    APROVADO: [],
    EM_TRANSITO: [],
    ENTREGUE: [],
    NAO_AVANCOU: [],
  };
  for (const order of orders) {
    columns[order.status].push(order);
  }
  return columns;
}

export async function getOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      client: true,
      createdBy: { select: { name: true } },
      onBehalfOf: { select: { name: true } },
      items: {
        include: {
          variant: { include: { product: true, supplierCodes: true } },
          presentation: true,
          supplier: true,
        },
        orderBy: { createdAt: "asc" },
      },
      statusHistory: {
        include: { changedBy: { select: { name: true } } },
        orderBy: { changedAt: "desc" },
      },
      comparisons: { select: { id: true, label: true, status: true, createdAt: true } },
      documents: true,
      notes: {
        include: {
          createdBy: { select: { name: true } },
          onBehalfOf: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function updateOrderStatusAction(
  orderId: string,
  toStatus: (typeof orderStatusValues)[number],
  motivo?: (typeof naoAvancouMotivoValues)[number],
) {
  const user = await requireUser();
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  if (order.status === "NAO_AVANCOU") {
    throw new Error("Este pedido não avançou — estado permanente.");
  }
  if (toStatus === "NAO_AVANCOU" && !motivo) {
    throw new Error("Indica o motivo de 'Não avançou'.");
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: toStatus,
        naoAvancouMotivo: toStatus === "NAO_AVANCOU" ? motivo : null,
      },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus,
        motivo: toStatus === "NAO_AVANCOU" ? motivo : null,
        changedById: user.id,
      },
    }),
  ]);

  await logAudit({
    entityType: "Order",
    entityId: orderId,
    action: "STATUS_CHANGE",
    actorId: user.id,
    changes: { from: order.status, to: toStatus, motivo },
  });

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
}

export async function addOrderItemAction(orderId: string, formData: FormData) {
  await requireUser();
  const data = orderItemSchema.parse({
    variantId: formData.get("variantId"),
    freeTextProduct: formData.get("freeTextProduct"),
    quantity: formData.get("quantity") || 1,
    supplierId: formData.get("supplierId"),
    unitPrice: formData.get("unitPrice") || undefined,
    currency: formData.get("currency") || "EUR",
  });

  await prisma.orderItem.create({
    data: {
      orderId,
      variantId: data.variantId || null,
      freeTextProduct: data.freeTextProduct || null,
      quantity: data.quantity,
      supplierId: data.supplierId || null,
      unitPrice: data.unitPrice ?? null,
      currency: data.currency,
    },
  });

  revalidatePath(`/pedidos/${orderId}`);
}

export async function removeOrderItemAction(orderId: string, itemId: string) {
  await requireUser();
  await prisma.orderItem.delete({ where: { id: itemId } });
  revalidatePath(`/pedidos/${orderId}`);
}
