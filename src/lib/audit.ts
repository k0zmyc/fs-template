import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@prisma/client";

export async function audit(params: {
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  diff?: { before?: unknown; after?: unknown };
  userId: string;
  collectionId?: string;
  recordId?: string;
}) {
  await prisma.auditLog.create({ data: { ...params, diff: params.diff as any } });
}
