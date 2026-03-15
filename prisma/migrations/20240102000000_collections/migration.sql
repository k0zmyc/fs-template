-- Drop old tables
DROP TABLE IF EXISTS "Item" CASCADE;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "GlobalRole" AS ENUM ('USER', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "CollectionRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'INVITE', 'REMOVE', 'LOGIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role_new" "GlobalRole" NOT NULL DEFAULT 'USER';
ALTER TABLE "User" DROP COLUMN IF EXISTS "role";
ALTER TABLE "User" RENAME COLUMN "role_new" TO "role";
DROP TYPE IF EXISTS "Role";
DROP TYPE IF EXISTS "Status";

CREATE TABLE IF NOT EXISTS "Collection" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "icon" TEXT, "coverImage" TEXT,
  "fieldSchema" JSONB NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CollectionMember" (
  "id" TEXT NOT NULL, "collectionId" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "role" "CollectionRole" NOT NULL DEFAULT 'VIEWER', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CollectionMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CollectionMember_collectionId_userId_key" ON "CollectionMember"("collectionId", "userId");

CREATE TABLE IF NOT EXISTS "Record" (
  "id" TEXT NOT NULL, "collectionId" TEXT NOT NULL, "title" TEXT NOT NULL, "imageUrl" TEXT,
  "data" JSONB NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdById" TEXT NOT NULL,
  CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL, "action" "AuditAction" NOT NULL, "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL, "entityLabel" TEXT, "diff" JSONB, "userId" TEXT NOT NULL,
  "collectionId" TEXT, "recordId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CollectionMember" ADD CONSTRAINT "CollectionMember_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionMember" ADD CONSTRAINT "CollectionMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Record" ADD CONSTRAINT "Record_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Record" ADD CONSTRAINT "Record_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record"("id") ON DELETE SET NULL ON UPDATE CASCADE;
