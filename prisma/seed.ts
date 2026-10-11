import { prisma } from "../src/lib/prisma";
import { seedAdmin } from "./seed/admin";
import { seedDemoLogin } from "./seed/demo-login";
import { seedDemoData } from "./seed/demo";

async function main() {
  const admin = await seedAdmin();
  await seedDemoLogin();
  await seedDemoData(admin);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
