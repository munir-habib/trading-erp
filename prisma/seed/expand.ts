import { prisma } from "../../src/lib/prisma";
import { CATEGORY_DEFS, NAO_AVANCOU_MOTIVOS } from "./demo-data";
import { EXTRA_PRODUCT_STEMS, generateExtraSupplierNames } from "./expand-data";
import type { User, Category, Supplier, Product, ProductVariant, Client } from "@prisma/client";

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function randomSubset<T>(arr: readonly T[], min: number, max: number): T[] {
  const count = Math.min(arr.length, randomInt(min, max));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

const BASE_PRICE_RANGE: Record<string, [number, number]> = {
  "Medicamentos": [5, 60],
  "Descartáveis Médicos": [10, 90],
  "Material Cirúrgico": [15, 150],
  "Equipamento Hospitalar": [150, 3500],
  "Outros": [20, 200],
};

const EXTRA_CLIENT_NAMES = [
  "Clínica Nova Esperança", "Hospital Regional do Kwanza", "Farmácia São José Luanda",
  "Clínica Bem Cuidar", "Hospital Provincial de Cabinda", "Farmácia Central do Lobito",
  "Clínica Vida Plena", "Hospital Municipal de Viana", "Farmácia Estrela do Mar",
  "Distribuidora Farmacêutica Angolana", "Clínica Renascer", "Hospital Divina Providência",
  "Farmácia Boa Saúde", "Clínica Médica Cazenga", "Hospital Provincial do Uíge",
];

export async function seedExpansion(admin: User) {
  console.log("A expandir a base de dados (fornecedores, produtos, pedidos extra)...");

  const categoryRows = await prisma.category.findMany();
  const categories = new Map<string, Category>(categoryRows.map((c) => [c.name, c]));
  for (const def of CATEGORY_DEFS) {
    if (!categories.has(def.name)) {
      const created = await prisma.category.create({ data: def });
      categories.set(def.name, created);
    }
  }

  const certifications = await prisma.certification.findMany();

  // ---------- 100 fornecedores adicionais ----------
  const existingSupplierNames = new Set(
    (await prisma.supplier.findMany({ select: { name: true } })).map((s) => s.name),
  );
  const newSupplierDefs = generateExtraSupplierNames(100, existingSupplierNames);

  const newSuppliers: Supplier[] = [];
  for (const def of newSupplierDefs) {
    const categoryChoices = randomSubset(CATEGORY_DEFS.map((c) => c.name), 1, 2);
    const supplier = await prisma.supplier.create({
      data: {
        name: def.name,
        country: def.country,
        status: randomChoice(["ATIVO", "ATIVO", "POTENCIAL", "NUNCA_CONTACTADO", "INATIVO"]),
        email: `contacto@${def.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
        phone: `+${randomInt(1, 99)} ${randomInt(100000000, 999999999)}`,
        lastContactedAt: Math.random() < 0.7 ? daysAgo(randomInt(0, 90)) : null,
        createdById: admin.id,
        categories: { connect: categoryChoices.map((c) => ({ id: categories.get(c)!.id })) },
        certifications: {
          create: randomSubset(certifications, 0, 3).map((c) => ({ certificationId: c.id })),
        },
      },
    });
    newSuppliers.push(supplier);
  }
  console.log(`${newSuppliers.length} fornecedores criados.`);

  // ---------- 100 produtos adicionais ----------
  const existingProductNames = new Set(
    (await prisma.product.findMany({ select: { name: true } })).map((p) => p.name),
  );
  const newProducts: (Product & { variants: ProductVariant[] })[] = [];

  for (const stem of EXTRA_PRODUCT_STEMS) {
    if (existingProductNames.has(stem.name)) continue;
    existingProductNames.add(stem.name);

    const isMedicine = stem.category === "Medicamentos";
    const variantCount = randomInt(1, 2);
    const variants = Array.from({ length: variantCount }).map((_, i) => {
      if (isMedicine) {
        const dose = randomChoice(["125mg", "250mg", "500mg", "10mg", "20mg", "5mg/ml", "1g"]);
        return {
          name: dose,
          presentations: [
            {
              type: "BLISTER" as const,
              dose,
              qtyPerPackage: randomChoice([10, 20, 30]),
              unitsPerBox: randomChoice([100, 200, 300]),
            },
          ],
        };
      }
      const sizeLabel = i === 0 ? "Padrão" : randomChoice(["Compacto", "Reforçado", "Profissional"]);
      return {
        name: sizeLabel,
        presentations: [
          {
            type: "INDIVIDUAL" as const,
            qtyPerPackage: 1,
            unitsPerBox: randomChoice([1, 10, 50, 100]),
          },
        ],
      };
    });

    const product = await prisma.product.create({
      data: {
        name: stem.name,
        genericName: isMedicine ? stem.name : null,
        categoryId: categories.get(stem.category)!.id,
        createdById: admin.id,
        variants: {
          create: variants.map((v) => ({
            name: v.name,
            presentations: { create: v.presentations },
          })),
        },
      },
      include: { variants: true },
    });
    newProducts.push(product);
    if (newProducts.length >= 100) break;
  }
  console.log(`${newProducts.length} produtos criados.`);

  // ---------- códigos de fornecedor + histórico de preços ----------
  const allSuppliers = await prisma.supplier.findMany();
  for (const product of newProducts) {
    const categoryName =
      EXTRA_PRODUCT_STEMS.find((p) => p.name === product.name)?.category ?? "Outros";
    const [min, max] = BASE_PRICE_RANGE[categoryName];

    for (const variant of product.variants) {
      const supplierCount = randomInt(1, 5);
      const chosenSuppliers = randomSubset(allSuppliers, supplierCount, supplierCount);
      const basePrice = randomInt(min * 10, max * 10) / 10;

      for (const supplier of chosenSuppliers) {
        const price = Math.round(basePrice * (1 + (Math.random() * 0.3 - 0.15)) * 100) / 100;
        await prisma.supplierProductCode.create({
          data: {
            supplierId: supplier.id,
            variantId: variant.id,
            supplierCode: `${(supplier.country ?? "XX").slice(0, 2).toUpperCase()}-${randomInt(1000, 9999)}`,
          },
        });
        await prisma.priceHistory.create({
          data: {
            variantId: variant.id,
            supplierId: supplier.id,
            pricePerBox: price,
            currency: "EUR",
            recordedAt: daysAgo(randomInt(1, 150)),
          },
        });
      }
    }
  }
  console.log("Códigos de fornecedor e histórico de preços gerados.");

  // ---------- clientes adicionais ----------
  const existingClientNames = new Set(
    (await prisma.client.findMany({ select: { name: true } })).map((c) => c.name),
  );
  const newClients: Client[] = [];
  for (const name of EXTRA_CLIENT_NAMES) {
    if (existingClientNames.has(name)) continue;
    newClients.push(
      await prisma.client.create({
        data: {
          name,
          country: "Angola",
          email: `geral@${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.ao`,
          createdById: admin.id,
        },
      }),
    );
  }
  console.log(`${newClients.length} clientes criados.`);

  // ---------- pedidos extra, espalhados por todas as fases ----------
  const allClients = await prisma.client.findMany();
  const allProducts = await prisma.product.findMany({ include: { variants: true } });
  const statuses = [
    "PEDIDO_RECEBIDO", "EM_PROCUREMENT", "COTACAO_ENVIADA", "APROVADO",
    "EM_TRANSITO", "ENTREGUE", "NAO_AVANCOU",
  ] as const;
  const orderTypes = ["MEDICAMENTOS", "MATERIAL_CIRURGICO", "EQUIPAMENTO", "OUTRO"] as const;

  const existingOrderCount = await prisma.order.count();
  const year = new Date().getFullYear();
  let counter = existingOrderCount + 1;
  const totalNewOrders = 80;

  for (let i = 0; i < totalNewOrders; i++) {
    const client = randomChoice(allClients);
    const status = randomChoice(statuses);
    const orderType = randomChoice(orderTypes);
    const createdAt = daysAgo(randomInt(1, 200));

    let motivo: (typeof NAO_AVANCOU_MOTIVOS)[number] | undefined;
    if (status === "NAO_AVANCOU") {
      motivo = Math.random() < 0.4 ? "PRECO" : randomChoice(NAO_AVANCOU_MOTIVOS);
    }

    const itemCount = randomInt(1, 4);
    const orderProducts = randomSubset(allProducts, itemCount, itemCount);

    const order = await prisma.order.create({
      data: {
        reference: `PED-${year}-${String(counter++).padStart(4, "0")}`,
        clientId: client.id,
        orderType,
        status,
        naoAvancouMotivo: motivo,
        createdById: admin.id,
        createdAt,
        updatedAt: status === "PEDIDO_RECEBIDO" ? createdAt : daysAgo(randomInt(0, 30)),
        statusHistory: {
          create: { toStatus: "PEDIDO_RECEBIDO", changedById: admin.id, changedAt: createdAt },
        },
      },
    });

    for (const product of orderProducts) {
      if (product.variants.length === 0) continue;
      const variant = randomChoice(product.variants);
      const codes = await prisma.supplierProductCode.findMany({ where: { variantId: variant.id } });
      const supplierId = codes.length > 0 ? randomChoice(codes).supplierId : null;
      const priceEntry = supplierId
        ? await prisma.priceHistory.findFirst({
            where: { variantId: variant.id, supplierId },
            orderBy: { recordedAt: "desc" },
          })
        : null;

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          variantId: variant.id,
          quantity: randomInt(1, 25),
          supplierId,
          unitPrice: priceEntry?.pricePerBox ?? null,
          currency: "EUR",
        },
      });
    }

    if (status === "ENTREGUE") {
      const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
      const supplierIds = Array.from(new Set(items.map((i) => i.supplierId).filter(Boolean)));
      for (const supplierId of supplierIds) {
        await prisma.supplierEvaluation.create({
          data: {
            supplierId: supplierId as string,
            orderId: order.id,
            prazoCumprido: randomInt(2, 5),
            qualidade: randomInt(2, 5),
            documentacao: randomInt(2, 5),
            createdById: admin.id,
          },
        });
      }
    }
  }
  console.log(`${totalNewOrders} pedidos adicionais criados (todas as fases do pipeline).`);

  // ---------- atualizar ratings de todos os fornecedores ----------
  const suppliersToRate = await prisma.supplier.findMany();
  for (const supplier of suppliersToRate) {
    const evaluations = await prisma.supplierEvaluation.findMany({ where: { supplierId: supplier.id } });
    if (evaluations.length === 0) continue;
    const avg =
      evaluations.reduce((sum, e) => sum + (e.prazoCumprido + e.qualidade + e.documentacao) / 3, 0) /
      evaluations.length;
    await prisma.supplier.update({
      where: { id: supplier.id },
      data: { ratingAvg: avg, ratingCount: evaluations.length },
    });
  }

  const finalCounts = await Promise.all([
    prisma.supplier.count(),
    prisma.product.count(),
    prisma.client.count(),
    prisma.order.count(),
  ]);
  console.log(
    `Totais na base de dados agora: ${finalCounts[0]} fornecedores, ${finalCounts[1]} produtos, ${finalCounts[2]} clientes, ${finalCounts[3]} pedidos.`,
  );
}

if (require.main === module) {
  prisma.user
    .findFirstOrThrow({ where: { role: "ADMIN" } })
    .then((admin) => seedExpansion(admin))
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
