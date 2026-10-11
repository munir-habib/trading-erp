"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { supplierSchema, quickSupplierSchema } from "@/lib/validation/supplier";
import type { Prisma } from "@prisma/client";

function parseSupplierForm(formData: FormData) {
  return supplierSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    whatsapp: formData.get("whatsapp"),
    phone: formData.get("phone"),
    country: formData.get("country"),
    status: formData.get("status") || "NUNCA_CONTACTADO",
    driveLink: formData.get("driveLink"),
    notes: formData.get("notes"),
    categoryIds: formData.getAll("categoryIds").filter(Boolean),
    certificationIds: formData.getAll("certificationIds").filter(Boolean),
    onBehalfOfId: formData.get("onBehalfOfId"),
  });
}

export async function createSupplierAction(formData: FormData) {
  const user = await requireUser();
  const data = parseSupplierForm(formData);
  const onBehalfOfId =
    user.role === "ADMIN" && data.onBehalfOfId ? data.onBehalfOfId : null;

  const supplier = await prisma.supplier.create({
    data: {
      name: data.name,
      email: data.email || null,
      whatsapp: data.whatsapp || null,
      phone: data.phone || null,
      country: data.country || null,
      status: data.status,
      driveLink: data.driveLink || null,
      notes: data.notes || null,
      createdById: user.id,
      onBehalfOfId,
      categories: { connect: data.categoryIds.map((id) => ({ id })) },
      certifications: {
        create: data.certificationIds.map((certificationId) => ({
          certificationId,
        })),
      },
    },
  });

  await logAudit({
    entityType: "Supplier",
    entityId: supplier.id,
    action: "CREATE",
    actorId: user.id,
    onBehalfOfId,
    changes: { name: data.name, status: data.status },
  });

  revalidatePath("/fornecedores");
  redirect(`/fornecedores/${supplier.id}`);
}

export async function updateSupplierAction(supplierId: string, formData: FormData) {
  const user = await requireUser();
  const data = parseSupplierForm(formData);
  const onBehalfOfId =
    user.role === "ADMIN" && data.onBehalfOfId ? data.onBehalfOfId : null;

  await prisma.$transaction([
    prisma.supplier.update({
      where: { id: supplierId },
      data: {
        name: data.name,
        email: data.email || null,
        whatsapp: data.whatsapp || null,
        phone: data.phone || null,
        country: data.country || null,
        status: data.status,
        driveLink: data.driveLink || null,
        notes: data.notes || null,
        categories: { set: data.categoryIds.map((id) => ({ id })) },
      },
    }),
    prisma.supplierCertification.deleteMany({ where: { supplierId } }),
    prisma.supplierCertification.createMany({
      data: data.certificationIds.map((certificationId) => ({
        supplierId,
        certificationId,
      })),
      skipDuplicates: true,
    }),
  ]);

  await logAudit({
    entityType: "Supplier",
    entityId: supplierId,
    action: "UPDATE",
    actorId: user.id,
    onBehalfOfId,
    changes: { name: data.name, status: data.status },
  });

  revalidatePath("/fornecedores");
  revalidatePath(`/fornecedores/${supplierId}`);
}

export async function quickCreateSupplierAction(formData: FormData) {
  const user = await requireUser();
  const data = quickSupplierSchema.parse({
    name: formData.get("name"),
    contact: formData.get("contact"),
    categoryId: formData.get("categoryId"),
  });

  const contact = data.contact?.trim() || "";
  const isEmail = contact.includes("@");

  const supplier = await prisma.supplier.create({
    data: {
      name: data.name,
      email: isEmail ? contact : null,
      phone: !isEmail && contact ? contact : null,
      status: "NUNCA_CONTACTADO",
      createdById: user.id,
      categories: data.categoryId
        ? { connect: [{ id: data.categoryId }] }
        : undefined,
    },
  });

  await logAudit({
    entityType: "Supplier",
    entityId: supplier.id,
    action: "CREATE",
    actorId: user.id,
    note: "Criação rápida — perfil por completar.",
  });

  revalidatePath("/fornecedores");
  return supplier;
}

type SupplierNewsOption =
  | "NOVO_PRODUTO"
  | "MUDANCA_CONTACTO"
  | "ALTERACAO_PRECOS"
  | "NADA";

const SUPPLIER_NEWS_LABELS: Record<SupplierNewsOption, string> = {
  NOVO_PRODUTO: "Novo produto",
  MUDANCA_CONTACTO: "Mudança de contacto",
  ALTERACAO_PRECOS: "Alteração de preços",
  NADA: "Nada",
};

export async function recordSupplierNewsAction(
  supplierId: string,
  option: SupplierNewsOption,
) {
  const user = await requireUser();
  if (option === "NADA") return;

  await prisma.supplier.update({
    where: { id: supplierId },
    data: { lastContactedAt: new Date() },
  });

  await logAudit({
    entityType: "Supplier",
    entityId: supplierId,
    action: "UPDATE",
    actorId: user.id,
    note: `Novidades sinalizadas: ${SUPPLIER_NEWS_LABELS[option]}`,
  });

  revalidatePath(`/fornecedores/${supplierId}`);
}

export interface SupplierFilters {
  search?: string;
  status?: string;
  categoryId?: string;
  country?: string;
  staleOnly?: boolean;
  staleDays?: number;
}

export async function listSuppliers(filters: SupplierFilters = {}) {
  const where: Prisma.SupplierWhereInput = {};

  if (filters.search) {
    where.name = { contains: filters.search, mode: "insensitive" };
  }
  if (filters.status) {
    where.status = filters.status as Prisma.EnumSupplierStatusFilter["equals"];
  }
  if (filters.categoryId) {
    where.categories = { some: { id: filters.categoryId } };
  }
  if (filters.country) {
    where.country = { equals: filters.country, mode: "insensitive" };
  }
  if (filters.staleOnly) {
    const days = filters.staleDays ?? 30;
    const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    where.OR = [
      { lastContactedAt: null },
      { lastContactedAt: { lt: threshold } },
    ];
  }

  return prisma.supplier.findMany({
    where,
    include: { categories: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSupplier(id: string) {
  return prisma.supplier.findUnique({
    where: { id },
    include: {
      categories: true,
      certifications: { include: { certification: true } },
      createdBy: { select: { name: true } },
      onBehalfOf: { select: { name: true } },
      productCodes: { include: { variant: { include: { product: true } } } },
      priceHistory: {
        orderBy: { recordedAt: "desc" },
        take: 20,
        include: { variant: { include: { product: true } } },
      },
    },
  });
}

export async function exportSuppliersToExcelAction() {
  await requireAdmin();
  const ExcelJS = (await import("exceljs")).default;
  const suppliers = await prisma.supplier.findMany({
    include: { categories: true },
    orderBy: { name: "asc" },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Fornecedores");
  sheet.columns = [
    { header: "Nome", key: "name", width: 30 },
    { header: "Email", key: "email", width: 25 },
    { header: "WhatsApp", key: "whatsapp", width: 18 },
    { header: "Telefone", key: "phone", width: 18 },
    { header: "País", key: "country", width: 16 },
    { header: "Estado", key: "status", width: 18 },
    { header: "Categorias", key: "categories", width: 30 },
    { header: "Drive", key: "driveLink", width: 30 },
  ];
  for (const s of suppliers) {
    sheet.addRow({
      name: s.name,
      email: s.email,
      whatsapp: s.whatsapp,
      phone: s.phone,
      country: s.country,
      status: s.status,
      categories: s.categories.map((c) => c.name).join(", "),
      driveLink: s.driveLink,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}

export async function importSuppliersFromExcelAction(base64: string) {
  const user = await requireUser();
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(Buffer.from(base64, "base64") as any);
  const sheet = workbook.worksheets[0];
  if (!sheet) return { imported: 0, errors: ["Ficheiro vazio."] };

  const header = (sheet.getRow(1).values as unknown[]).map((v) =>
    String(v ?? "").trim().toLowerCase(),
  );
  const colIndex = (name: string) => header.indexOf(name);

  const nameCol = colIndex("nome");
  const emailCol = colIndex("email");
  const whatsappCol = colIndex("whatsapp");
  const phoneCol = colIndex("telefone");
  const countryCol = colIndex("país") >= 0 ? colIndex("país") : colIndex("pais");
  const driveCol = colIndex("drive");

  let imported = 0;
  const errors: string[] = [];
  const batch = await prisma.importBatch.create({
    data: {
      type: "FORNECEDORES",
      filename: "upload.xlsx",
      status: "PENDENTE",
      createdById: user.id,
    },
  });

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const name = nameCol >= 0 ? String(row.getCell(nameCol).value ?? "").trim() : "";
    if (!name) continue;

    try {
      await prisma.supplier.create({
        data: {
          name,
          email: emailCol >= 0 ? String(row.getCell(emailCol).value ?? "") || null : null,
          whatsapp:
            whatsappCol >= 0 ? String(row.getCell(whatsappCol).value ?? "") || null : null,
          phone: phoneCol >= 0 ? String(row.getCell(phoneCol).value ?? "") || null : null,
          country: countryCol >= 0 ? String(row.getCell(countryCol).value ?? "") || null : null,
          driveLink: driveCol >= 0 ? String(row.getCell(driveCol).value ?? "") || null : null,
          status: "NUNCA_CONTACTADO",
          createdById: user.id,
        },
      });
      imported++;
    } catch (err) {
      errors.push(`Linha ${rowNumber}: ${(err as Error).message}`);
    }
  }

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      rowCount: imported,
      status: errors.length > 0 ? "ERRO" : "PROCESSADO",
      errorLog: errors.length > 0 ? errors.join("\n") : null,
    },
  });

  revalidatePath("/fornecedores");
  return { imported, errors };
}
