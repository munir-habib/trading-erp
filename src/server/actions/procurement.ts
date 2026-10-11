"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function registerShipmentAction(orderId: string, supplierNames: string[]) {
  const user = await requireUser();
  await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  await logAudit({
    entityType: "Order",
    entityId: orderId,
    action: "UPDATE",
    actorId: user.id,
    note: `Pedidos de compra enviados a: ${supplierNames.join(", ")}.`,
  });

  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath(`/pedidos/${orderId}/carrinho`);
}
