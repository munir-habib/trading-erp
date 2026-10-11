import bcrypt from "bcryptjs";
import { prisma } from "../../src/lib/prisma";

export const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "demo@example.com";
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD;

export async function seedDemoLogin() {
  if (!DEMO_PASSWORD) {
    console.log("DEMO_PASSWORD não definida: conta demo não criada.");
    return null;
  }
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    console.log(`Conta demo já existe (${DEMO_EMAIL}).`);
    return existing;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const demo = await prisma.user.create({
    data: {
      name: "Demo",
      email: DEMO_EMAIL,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("========================================");
  console.log("Conta DEMO criada:");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log("  Password: (a definida em DEMO_PASSWORD)");
  console.log("========================================");

  return demo;
}
