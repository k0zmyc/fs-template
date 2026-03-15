import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { email: "admin@example.com", name: "Admin", password, role: "ADMIN" },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: { email: "user@example.com", name: "Regular User", password, role: "USER" },
  });

  const col1 = await prisma.collection.create({
    data: {
      name: "Film Library",
      description: "A collection of favourite films",
      icon: "🎬",
      fieldSchema: [
        { name: "director", type: "text", label: "Director" },
        { name: "year", type: "number", label: "Year" },
        { name: "genre", type: "select", label: "Genre", options: ["Action", "Drama", "Comedy", "Sci-Fi", "Horror"] },
        { name: "rating", type: "select", label: "Rating", options: ["1", "2", "3", "4", "5"] },
        { name: "watched", type: "boolean", label: "Watched" },
      ],
      members: {
        create: [
          { userId: admin.id, role: "OWNER" },
          { userId: user.id, role: "VIEWER" },
        ],
      },
    },
  });

  const col2 = await prisma.collection.create({
    data: {
      name: "Book Club",
      description: "Books we are reading",
      icon: "📚",
      fieldSchema: [
        { name: "author", type: "text", label: "Author" },
        { name: "pages", type: "number", label: "Pages" },
        { name: "status", type: "select", label: "Status", options: ["To Read", "Reading", "Finished"] },
        { name: "notes", type: "textarea", label: "Notes" },
      ],
      members: {
        create: [
          { userId: admin.id, role: "OWNER" },
          { userId: user.id, role: "EDITOR" },
        ],
      },
    },
  });

  await prisma.record.createMany({
    data: [
      { collectionId: col1.id, title: "Blade Runner 2049", data: { director: "Denis Villeneuve", year: 2017, genre: "Sci-Fi", rating: "5", watched: true }, createdById: admin.id },
      { collectionId: col1.id, title: "Interstellar", data: { director: "Christopher Nolan", year: 2014, genre: "Sci-Fi", rating: "5", watched: true }, createdById: admin.id },
      { collectionId: col2.id, title: "Dune", data: { author: "Frank Herbert", pages: 412, status: "Finished", notes: "Epic world-building" }, createdById: admin.id },
    ],
  });

  await prisma.auditLog.create({
    data: { action: "CREATE", entityType: "Collection", entityId: col1.id, entityLabel: col1.name, userId: admin.id, collectionId: col1.id },
  });

  console.log("✅ Seed complete");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
