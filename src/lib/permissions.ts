import { prisma } from "@/lib/prisma";
import type { CollectionRole, GlobalRole } from "@prisma/client";

export type Permission = "view" | "edit" | "manage"; // manage = invite/delete members, edit schema

const ROLE_PERMISSIONS: Record<CollectionRole, Permission[]> = {
  OWNER:  ["view", "edit", "manage"],
  EDITOR: ["view", "edit"],
  VIEWER: ["view"],
};

export async function getCollectionRole(userId: string, collectionId: string): Promise<CollectionRole | null> {
  const m = await prisma.collectionMember.findUnique({
    where: { collectionId_userId: { collectionId, userId } },
  });
  return m?.role ?? null;
}

export async function can(
  userId: string,
  globalRole: GlobalRole,
  collectionId: string,
  permission: Permission
): Promise<boolean> {
  if (globalRole === "ADMIN") return true;
  const role = await getCollectionRole(userId, collectionId);
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}
