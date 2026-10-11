"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { uploadToStorage, deleteFromStorage, getSignedUrl, isStorageConfigured } from "@/lib/storage";

interface AttachmentTarget {
  orderId?: string;
  supplierId?: string;
  clientId?: string;
}

export async function listAttachments(target: AttachmentTarget) {
  return prisma.attachment.findMany({
    where: target,
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function uploadAttachmentAction(target: AttachmentTarget, formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file") as File | null;
  const label = (formData.get("label") as string) || null;
  if (!file || file.size === 0) throw new Error("Escolhe um ficheiro.");

  const entityType = target.orderId ? "orders" : target.supplierId ? "suppliers" : "clients";
  const entityId = target.orderId || target.supplierId || target.clientId;
  const path = `${entityType}/${entityId}/${Date.now()}-${file.name}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadToStorage(path, buffer, file.type || "application/octet-stream");

  const attachment = await prisma.attachment.create({
    data: {
      ...target,
      filename: file.name,
      storagePath: path,
      mimeType: file.type || null,
      label,
      uploadedById: user.id,
    },
  });

  await logAudit({
    entityType: entityType === "orders" ? "Order" : entityType === "suppliers" ? "Supplier" : "Client",
    entityId: entityId!,
    action: "CREATE",
    actorId: user.id,
    note: `Anexo carregado: ${file.name}`,
  });

  if (target.orderId) revalidatePath(`/pedidos/${target.orderId}`);
  if (target.supplierId) revalidatePath(`/fornecedores/${target.supplierId}`);
  if (target.clientId) revalidatePath(`/clientes/${target.clientId}`);

  return attachment;
}

export async function getAttachmentUrlAction(attachmentId: string) {
  const attachment = await prisma.attachment.findUniqueOrThrow({ where: { id: attachmentId } });
  return getSignedUrl(attachment.storagePath);
}

export async function deleteAttachmentAction(attachmentId: string, target: AttachmentTarget) {
  await requireUser();
  const attachment = await prisma.attachment.findUniqueOrThrow({ where: { id: attachmentId } });
  await deleteFromStorage(attachment.storagePath);
  await prisma.attachment.delete({ where: { id: attachmentId } });

  if (target.orderId) revalidatePath(`/pedidos/${target.orderId}`);
  if (target.supplierId) revalidatePath(`/fornecedores/${target.supplierId}`);
  if (target.clientId) revalidatePath(`/clientes/${target.clientId}`);
}

export async function checkStorageConfigured() {
  return isStorageConfigured();
}
