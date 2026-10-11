"use server";

import { prisma } from "@/lib/prisma";

export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}
