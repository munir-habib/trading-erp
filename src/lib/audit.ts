import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export { formatCreatedBy } from "@/lib/format";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE";

interface LogAuditInput {
  entityType: string;
  entityId: string;
  action: AuditAction;
  actorId: string;
  onBehalfOfId?: string | null;
  changes?: Prisma.InputJsonValue;
  note?: string;
}

export async function logAudit(input: LogAuditInput) {
  return prisma.auditEvent.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actorId: input.actorId,
      onBehalfOfId: input.onBehalfOfId ?? null,
      changes: input.changes,
      note: input.note,
    },
  });
}

export async function getAuditTrail(entityType: string, entityId: string) {
  return prisma.auditEvent.findMany({
    where: { entityType, entityId },
    include: {
      actor: { select: { id: true, name: true } },
      onBehalfOf: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
