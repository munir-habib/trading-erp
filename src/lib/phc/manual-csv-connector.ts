import { prisma } from "@/lib/prisma";
import type { PhcConnector, PhcImportResult } from "@/lib/phc/connector";

async function loadWorkbook(base64: string) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(Buffer.from(base64, "base64") as any);
  return workbook.worksheets[0];
}

function headerIndex(sheet: Awaited<ReturnType<typeof loadWorkbook>>, name: string) {
  if (!sheet) return -1;
  const header = (sheet.getRow(1).values as unknown[]).map((v) =>
    String(v ?? "").trim().toLowerCase(),
  );
  return header.indexOf(name);
}

/** Opção 3: importação manual via Excel/CSV — baseline funcional já disponível. */
export class ManualCsvConnector implements PhcConnector {
  async importClients(fileBase64: string, userId: string): Promise<PhcImportResult> {
    const sheet = await loadWorkbook(fileBase64);
    if (!sheet) return { imported: 0, errors: ["Ficheiro vazio."] };

    const nameCol = headerIndex(sheet, "nome");
    const emailCol = headerIndex(sheet, "email");
    const phoneCol = headerIndex(sheet, "telefone");
    const countryCol = headerIndex(sheet, "país") >= 0 ? headerIndex(sheet, "país") : headerIndex(sheet, "pais");

    const batch = await prisma.importBatch.create({
      data: { type: "CLIENTES", filename: "phc-clientes.xlsx", status: "PENDENTE", createdById: userId },
    });

    let imported = 0;
    const errors: string[] = [];
    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      const name = nameCol >= 0 ? String(row.getCell(nameCol).value ?? "").trim() : "";
      if (!name) continue;
      try {
        await prisma.client.create({
          data: {
            name,
            email: emailCol >= 0 ? String(row.getCell(emailCol).value ?? "") || null : null,
            phone: phoneCol >= 0 ? String(row.getCell(phoneCol).value ?? "") || null : null,
            country: countryCol >= 0 ? String(row.getCell(countryCol).value ?? "") || null : null,
            createdById: userId,
          },
        });
        imported++;
      } catch (err) {
        errors.push(`Linha ${rowNumber}: ${(err as Error).message}`);
      }
    }

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { rowCount: imported, status: errors.length > 0 ? "ERRO" : "PROCESSADO", errorLog: errors.join("\n") || null },
    });

    return { imported, errors };
  }

  async importProducts(fileBase64: string, userId: string): Promise<PhcImportResult> {
    const sheet = await loadWorkbook(fileBase64);
    if (!sheet) return { imported: 0, errors: ["Ficheiro vazio."] };

    const nameCol = headerIndex(sheet, "nome");
    const genericCol = headerIndex(sheet, "genérico") >= 0 ? headerIndex(sheet, "genérico") : headerIndex(sheet, "generico");

    const batch = await prisma.importBatch.create({
      data: { type: "PRODUTOS", filename: "phc-produtos.xlsx", status: "PENDENTE", createdById: userId },
    });

    let imported = 0;
    const errors: string[] = [];
    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      const name = nameCol >= 0 ? String(row.getCell(nameCol).value ?? "").trim() : "";
      if (!name) continue;
      try {
        await prisma.product.create({
          data: {
            name,
            genericName: genericCol >= 0 ? String(row.getCell(genericCol).value ?? "") || null : null,
            createdById: userId,
          },
        });
        imported++;
      } catch (err) {
        errors.push(`Linha ${rowNumber}: ${(err as Error).message}`);
      }
    }

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { rowCount: imported, status: errors.length > 0 ? "ERRO" : "PROCESSADO", errorLog: errors.join("\n") || null },
    });

    return { imported, errors };
  }
}
