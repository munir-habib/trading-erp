import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { prisma } from "../../src/lib/prisma";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Admin";

function generatePassword(length = 16) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export async function seedAdmin() {
  if (!ADMIN_EMAIL) {
    throw new Error("Defina ADMIN_EMAIL no .env antes de correr o seed (email da conta ADMIN inicial).");
  }
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log(`Admin já existe (${ADMIN_EMAIL}) — password não foi alterada.`);
    return existing;
  }

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: "ADMIN",
    },
  });

  const filePath = path.join(process.cwd(), "CREDENCIAIS.md");
  const content = `# Credenciais de acesso — ERP Trading

Geradas automaticamente pelo seed em ${new Date().toISOString()}.
Este ficheiro NUNCA deve ser commitado nem partilhado por canais não seguros.

## Conta ADMIN

- Email: ${ADMIN_EMAIL}
- Password: ${password}

Recomenda-se alterar a password após o primeiro login.
`;
  await fs.writeFile(filePath, content, "utf-8");

  console.log("========================================");
  console.log("Conta ADMIN criada:");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${password}`);
  console.log(`Guardada também em: ${filePath}`);
  console.log("========================================");

  return admin;
}
