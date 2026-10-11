"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const evaluationSchema = z.object({
  prazoCumprido: z.coerce.number().int().min(1).max(5),
  qualidade: z.coerce.number().int().min(1).max(5),
  documentacao: z.coerce.number().int().min(1).max(5),
  note: z.string().optional().or(z.literal("")),
});

export async function createEvaluationAction(
  supplierId: string,
  orderId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const data = evaluationSchema.parse({
    prazoCumprido: formData.get("prazoCumprido"),
    qualidade: formData.get("qualidade"),
    documentacao: formData.get("documentacao"),
    note: formData.get("note"),
  });

  await prisma.supplierEvaluation.create({
    data: {
      supplierId,
      orderId,
      prazoCumprido: data.prazoCumprido,
      qualidade: data.qualidade,
      documentacao: data.documentacao,
      note: data.note || null,
      createdById: user.id,
    },
  });

  const evaluations = await prisma.supplierEvaluation.findMany({ where: { supplierId } });
  const avg =
    evaluations.reduce((sum, e) => sum + (e.prazoCumprido + e.qualidade + e.documentacao) / 3, 0) /
    evaluations.length;

  await prisma.supplier.update({
    where: { id: supplierId },
    data: { ratingAvg: avg, ratingCount: evaluations.length },
  });

  await logAudit({
    entityType: "Supplier",
    entityId: supplierId,
    action: "UPDATE",
    actorId: user.id,
    note: `Avaliação registada (pedido associado).`,
  });

  revalidatePath(`/fornecedores/${supplierId}`);
  revalidatePath(`/pedidos/${orderId}`);
}

export async function getOrderSupplierEvaluations(orderId: string) {
  return prisma.supplierEvaluation.findMany({ where: { orderId } });
}
