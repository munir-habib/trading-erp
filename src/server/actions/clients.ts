"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { clientSchema } from "@/lib/validation/order";

export async function listClients() {
  return prisma.client.findMany({
    include: { orders: { select: { createdAt: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getClient(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          items: { include: { variant: { include: { product: true } } } },
          margin: true,
        },
      },
    },
  });
}

export async function updateClientAction(clientId: string, formData: FormData) {
  const user = await requireUser();
  const data = clientSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    country: formData.get("country"),
    driveLink: formData.get("driveLink"),
  });

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      country: data.country || null,
      driveLink: data.driveLink || null,
    },
  });

  await logAudit({
    entityType: "Client",
    entityId: clientId,
    action: "UPDATE",
    actorId: user.id,
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
}

export async function getLastOrderSuppliers(clientId: string) {
  const lastOrder = await prisma.order.findFirst({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { supplier: true }, where: { supplierId: { not: null } } } },
  });
  if (!lastOrder) return [];
  const names = new Set(lastOrder.items.map((i) => i.supplier!.name));
  return Array.from(names);
}

export async function createClientAction(formData: FormData) {
  const user = await requireUser();
  const data = clientSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    country: formData.get("country"),
    driveLink: formData.get("driveLink"),
  });

  const client = await prisma.client.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      country: data.country || null,
      driveLink: data.driveLink || null,
      createdById: user.id,
    },
  });

  await logAudit({
    entityType: "Client",
    entityId: client.id,
    action: "CREATE",
    actorId: user.id,
  });

  revalidatePath("/clientes");
  return client;
}

export async function quickCreateClientAction(name: string) {
  const user = await requireUser();
  const client = await prisma.client.create({
    data: { name, createdById: user.id },
  });
  await logAudit({
    entityType: "Client",
    entityId: client.id,
    action: "CREATE",
    actorId: user.id,
    note: "Criação rápida a partir do formulário de pedido.",
  });
  revalidatePath("/clientes");
  return client;
}
