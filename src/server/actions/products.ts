"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { productSchema, commercialMappingSchema } from "@/lib/validation/product";
import type { Prisma } from "@prisma/client";

function parseProductForm(formData: FormData) {
  const variantsRaw = formData.get("variantsJson");
  let variants: unknown = [];
  try {
    variants = variantsRaw ? JSON.parse(String(variantsRaw)) : [];
  } catch {
    variants = [];
  }

  return productSchema.parse({
    name: formData.get("name"),
    genericName: formData.get("genericName"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    variants,
  });
}

export async function createProductAction(formData: FormData) {
  const user = await requireUser();
  const data = parseProductForm(formData);

  const product = await prisma.product.create({
    data: {
      name: data.name,
      genericName: data.genericName || null,
      categoryId: data.categoryId || null,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      createdById: user.id,
      variants: {
        create: data.variants.map((v) => ({
          name: v.name,
          sku: v.sku || null,
          presentations: {
            create: v.presentations.map((p) => ({
              type: p.type,
              dose: p.dose || null,
              qtyPerPackage: p.qtyPerPackage,
              unitsPerBox: p.unitsPerBox,
            })),
          },
        })),
      },
    },
  });

  await logAudit({
    entityType: "Product",
    entityId: product.id,
    action: "CREATE",
    actorId: user.id,
    changes: { name: data.name },
  });

  revalidatePath("/produtos");
  redirect(`/produtos/${product.id}`);
}

export async function updateProductAction(productId: string, formData: FormData) {
  const user = await requireUser();
  const data = parseProductForm(formData);

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        genericName: data.genericName || null,
        categoryId: data.categoryId || null,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
      },
    });

    const existingVariants = await tx.productVariant.findMany({
      where: { productId },
      select: { id: true },
    });
    const keepIds = data.variants.filter((v) => v.id).map((v) => v.id as string);
    const toDelete = existingVariants
      .map((v) => v.id)
      .filter((id) => !keepIds.includes(id));
    if (toDelete.length > 0) {
      await tx.productVariant.deleteMany({ where: { id: { in: toDelete } } });
    }

    for (const variant of data.variants) {
      if (variant.id) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { name: variant.name, sku: variant.sku || null },
        });
        const existingPresentations = await tx.presentation.findMany({
          where: { variantId: variant.id },
          select: { id: true },
        });
        const keepPresIds = variant.presentations
          .filter((p) => p.id)
          .map((p) => p.id as string);
        const toDeletePres = existingPresentations
          .map((p) => p.id)
          .filter((id) => !keepPresIds.includes(id));
        if (toDeletePres.length > 0) {
          await tx.presentation.deleteMany({ where: { id: { in: toDeletePres } } });
        }
        for (const presentation of variant.presentations) {
          if (presentation.id) {
            await tx.presentation.update({
              where: { id: presentation.id },
              data: {
                type: presentation.type,
                dose: presentation.dose || null,
                qtyPerPackage: presentation.qtyPerPackage,
                unitsPerBox: presentation.unitsPerBox,
              },
            });
          } else {
            await tx.presentation.create({
              data: {
                variantId: variant.id,
                type: presentation.type,
                dose: presentation.dose || null,
                qtyPerPackage: presentation.qtyPerPackage,
                unitsPerBox: presentation.unitsPerBox,
              },
            });
          }
        }
      } else {
        await tx.productVariant.create({
          data: {
            productId,
            name: variant.name,
            sku: variant.sku || null,
            presentations: {
              create: variant.presentations.map((p) => ({
                type: p.type,
                dose: p.dose || null,
                qtyPerPackage: p.qtyPerPackage,
                unitsPerBox: p.unitsPerBox,
              })),
            },
          },
        });
      }
    }
  });

  await logAudit({
    entityType: "Product",
    entityId: productId,
    action: "UPDATE",
    actorId: user.id,
    changes: { name: data.name },
  });

  revalidatePath("/produtos");
  revalidatePath(`/produtos/${productId}`);
}

export async function listProducts(search?: string) {
  const where: Prisma.ProductWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { genericName: { contains: search, mode: "insensitive" } },
          { variants: { some: { name: { contains: search, mode: "insensitive" } } } },
        ],
      }
    : {};

  return prisma.product.findMany({
    where,
    include: { category: true, variants: { include: { presentations: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: {
        include: {
          presentations: true,
          supplierCodes: { include: { supplier: true } },
          priceHistory: {
            orderBy: { recordedAt: "desc" },
            take: 10,
            include: { supplier: true },
          },
        },
      },
    },
  });
}

/** Sugestão por família: fornecedores da mesma categoria quando o produto não tem nenhum associado. */
export async function suggestSuppliersFromFamily(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      categoryId: true,
      variants: { select: { supplierCodes: { select: { supplierId: true } } } },
    },
  });
  if (!product) return [];

  const hasSupplier = product.variants.some((v) => v.supplierCodes.length > 0);
  if (hasSupplier || !product.categoryId) return [];

  return prisma.supplier.findMany({
    where: { categories: { some: { id: product.categoryId } } },
    take: 10,
    orderBy: { ratingAvg: "desc" },
  });
}

export async function listAllVariants() {
  const variants = await prisma.productVariant.findMany({
    include: { product: { select: { name: true } } },
    orderBy: { product: { name: "asc" } },
  });
  return variants.map((v) => ({ id: v.id, name: `${v.product.name} — ${v.name}` }));
}

export async function listCommercialMappings() {
  return prisma.commercialNameMapping.findMany({ orderBy: { commercialName: "asc" } });
}

export async function createCommercialMappingAction(formData: FormData) {
  await requireUser();
  const data = commercialMappingSchema.parse({
    commercialName: formData.get("commercialName"),
    genericName: formData.get("genericName"),
  });

  await prisma.commercialNameMapping.upsert({
    where: { commercialName: data.commercialName },
    update: { genericName: data.genericName },
    create: data,
  });

  revalidatePath("/produtos/dicionario");
}

export async function deleteCommercialMappingAction(id: string) {
  await requireUser();
  await prisma.commercialNameMapping.delete({ where: { id } });
  revalidatePath("/produtos/dicionario");
}
