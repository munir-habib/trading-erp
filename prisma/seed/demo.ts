import { prisma } from "../../src/lib/prisma";
import {
  CATEGORY_DEFS,
  CERTIFICATION_DEFS,
  SUPPLIER_DEFS,
  CLIENT_NAMES,
  COMMERCIAL_MAPPINGS,
  PRODUCT_DEFS,
  NAO_AVANCOU_MOTIVOS,
} from "./demo-data";
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

export async function seedDemoData(admin: User) {
  const existingProducts = await prisma.product.count();
  if (existingProducts > 0) {
    console.log("Dados de demo já existem — a saltar seed de demo.");
    return;
  }

  console.log("A gerar dados de demo...");

  // Categorias
  const categories = new Map<string, Category>();
  for (const def of CATEGORY_DEFS) {
    const category = await prisma.category.create({ data: def });
    categories.set(def.name, category);
  }

  // Certificações
  const certifications = [];
  for (const name of CERTIFICATION_DEFS) {
    certifications.push(await prisma.certification.create({ data: { name } }));
  }

  // Dicionário nome comercial → genérico
  await prisma.commercialNameMapping.createMany({ data: COMMERCIAL_MAPPINGS });

  // Fornecedores
  const suppliers: Supplier[] = [];
  for (const def of SUPPLIER_DEFS) {
    const supplier = await prisma.supplier.create({
      data: {
        name: def.name,
        country: def.country,
        status: randomChoice(["ATIVO", "ATIVO", "ATIVO", "POTENCIAL", "NUNCA_CONTACTADO"]),
        email: `contacto@${def.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
        phone: `+${randomInt(1, 99)} ${randomInt(100000000, 999999999)}`,
        lastContactedAt: daysAgo(randomInt(0, 60)),
        createdById: admin.id,
        categories: { connect: def.categories.map((c) => ({ id: categories.get(c)!.id })) },
        certifications: {
          create: randomSubset(certifications, 1, 3).map((c) => ({ certificationId: c.id })),
        },
      },
    });
    suppliers.push(supplier);
  }

  // Produtos + variantes + apresentações
  const products: (Product & { variants: ProductVariant[] })[] = [];
  for (const def of PRODUCT_DEFS) {
    const product = await prisma.product.create({
      data: {
        name: def.name,
        genericName: def.genericName,
        categoryId: categories.get(def.category)!.id,
        createdById: admin.id,
        variants: {
          create: def.variants.map((v) => ({
            name: v.name,
            presentations: { create: v.presentations },
          })),
        },
      },
      include: { variants: true },
    });
    products.push(product);
  }

  // Fornecedor-código + histórico de preços por variante
  let singleSupplierAssigned = false;
  let belowMarketAssigned = false;
  let expiringQuoteAssigned = false;

  for (const product of products) {
    const categoryName = PRODUCT_DEFS.find((p) => p.name === product.name)!.category;
    const [min, max] = BASE_PRICE_RANGE[categoryName];

    for (const variant of product.variants) {
      const supplierCount = !singleSupplierAssigned && Math.random() < 0.06 ? 1 : randomInt(2, 4);
      const chosenSuppliers = randomSubset(suppliers, supplierCount, supplierCount);
      if (supplierCount === 1) singleSupplierAssigned = true;

      const basePrice = randomInt(min * 10, max * 10) / 10;

      for (let i = 0; i < chosenSuppliers.length; i++) {
        const supplier = chosenSuppliers[i];
        let price = basePrice * (1 + (Math.random() * 0.3 - 0.15));

        if (!belowMarketAssigned && chosenSuppliers.length >= 2 && i === chosenSuppliers.length - 1) {
          price = basePrice * 0.5;
          belowMarketAssigned = true;
        }

        await prisma.supplierProductCode.create({
          data: {
            supplierId: supplier.id,
            variantId: variant.id,
            supplierCode: `${supplier.country?.slice(0, 2).toUpperCase()}-${randomInt(1000, 9999)}`,
          },
        });

        await prisma.priceHistory.create({
          data: {
            variantId: variant.id,
            supplierId: supplier.id,
            pricePerBox: Math.round(price * 100) / 100,
            currency: "EUR",
            recordedAt: daysAgo(randomInt(1, 120)),
          },
        });
      }
    }
  }

  // Clientes
  const clients: Client[] = [];
  for (const name of CLIENT_NAMES) {
    clients.push(
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

  // Encomendas
  const statuses = [
    "PEDIDO_RECEBIDO", "EM_PROCUREMENT", "COTACAO_ENVIADA", "APROVADO",
    "EM_TRANSITO", "ENTREGUE", "NAO_AVANCOU",
  ] as const;
  const orderTypes = ["MEDICAMENTOS", "MATERIAL_CIRURGICO", "EQUIPAMENTO", "OUTRO"] as const;

  const naoAvancouMotivoCounts: Record<string, number> = {};
  let orderCounter = 1;
  const totalOrders = randomInt(45, 55);

  for (let i = 0; i < totalOrders; i++) {
    const client = randomChoice(clients);
    const status = randomChoice(statuses);
    const orderType = randomChoice(orderTypes);
    const createdAt = daysAgo(randomInt(1, 180));

    let motivo: (typeof NAO_AVANCOU_MOTIVOS)[number] | undefined;
    if (status === "NAO_AVANCOU") {
      // Viés para "PRECO" garante >=3 pedidos com o mesmo motivo (alerta do Módulo 12).
      motivo = Math.random() < 0.45 ? "PRECO" : randomChoice(NAO_AVANCOU_MOTIVOS);
      naoAvancouMotivoCounts[motivo] = (naoAvancouMotivoCounts[motivo] ?? 0) + 1;
    }

    const itemCount = randomInt(1, 4);
    const orderProducts = randomSubset(products, itemCount, itemCount);

    const order = await prisma.order.create({
      data: {
        reference: `PED-${createdAt.getFullYear()}-${String(orderCounter++).padStart(4, "0")}`,
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
      const variant = randomChoice(product.variants);
      const codes = await prisma.supplierProductCode.findMany({ where: { variantId: variant.id } });
      const supplierId = codes.length > 0 ? randomChoice(codes).supplierId : null;
      const priceHistoryEntry = supplierId
        ? await prisma.priceHistory.findFirst({
            where: { variantId: variant.id, supplierId },
            orderBy: { recordedAt: "desc" },
          })
        : null;

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          variantId: variant.id,
          quantity: randomInt(1, 20),
          supplierId,
          unitPrice: priceHistoryEntry?.pricePerBox ?? null,
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
            prazoCumprido: randomInt(3, 5),
            qualidade: randomInt(3, 5),
            documentacao: randomInt(2, 5),
            createdById: admin.id,
          },
        });
      }
    }

    if (Math.random() < 0.2) {
      await prisma.orderNote.create({
        data: {
          orderId: order.id,
          channel: randomChoice(["EMAIL", "WHATSAPP", "CHAMADA", "REUNIAO"]),
          content: randomChoice([
            "Cliente confirmou receção da proposta.",
            "A aguardar resposta do fornecedor.",
            "Reunião marcada para alinhar prazos de entrega.",
            "Cliente pediu revisão de preços.",
          ]),
          createdById: admin.id,
          createdAt: daysAgo(randomInt(0, 20)),
        },
      });
    }
  }

  // Atualizar ratings dos fornecedores a partir das avaliações
  for (const supplier of suppliers) {
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

  // Uma comparação de demonstração (núcleo do sistema), incluindo cotação a expirar em breve
  const demoProduct = products.find((p) => p.name === "Amoxicilina") ?? products[0];
  const demoVariant = demoProduct.variants[0];
  const demoCodes = await prisma.supplierProductCode.findMany({ where: { variantId: demoVariant.id } });
  if (demoCodes.length >= 2) {
    const comparison = await prisma.comparison.create({
      data: {
        label: `Comparação — ${demoProduct.name} ${demoVariant.name}`,
        createdById: admin.id,
        rows: {
          create: [{ variantId: demoVariant.id, position: 0 }],
        },
      },
      include: { rows: true },
    });
    const row = comparison.rows[0];
    for (let i = 0; i < demoCodes.length; i++) {
      const code = demoCodes[i];
      const ph = await prisma.priceHistory.findFirst({
        where: { variantId: demoVariant.id, supplierId: code.supplierId },
        orderBy: { recordedAt: "desc" },
      });
      await prisma.comparisonCell.create({
        data: {
          rowId: row.id,
          supplierId: code.supplierId,
          pricePerBox: ph?.pricePerBox ?? randomInt(10, 100),
          currency: "EUR",
          quoteExpiresAt: i === 0 ? daysAgo(-2) : undefined,
        },
      });
      expiringQuoteAssigned = true;
    }
  }

  // Regras de margem, custos fixos, câmbio
  await prisma.marginRule.create({ data: { categoryId: null, percentage: 20 } });
  await prisma.marginRule.create({ data: { categoryId: categories.get("Medicamentos")!.id, percentage: 25 } });

  await prisma.fixedCost.createMany({
    data: [
      { name: "Renda escritório", monthlyAmount: 1200, currency: "EUR" },
      { name: "Salários administrativos", monthlyAmount: 4500, currency: "EUR" },
      { name: "Software e licenças", monthlyAmount: 300, currency: "EUR" },
    ],
  });

  await prisma.exchangeRate.createMany({
    data: [
      { fromCurrency: "EUR", toCurrency: "AOA", rate: 1050 },
      { fromCurrency: "USD", toCurrency: "AOA", rate: 970 },
      { fromCurrency: "EUR", toCurrency: "USD", rate: 1.08 },
    ],
  });

  await prisma.faqArticle.createMany({
    data: [
      {
        title: "Como preparar a fatura proforma",
        content:
          "A fatura proforma é gerada automaticamente a partir dos produtos do pedido. Confirma sempre os preços antes de enviar ao cliente.",
        appliesToStatuses: ["COTACAO_ENVIADA", "APROVADO"],
      },
      {
        title: "Documentos obrigatórios para medicamentos",
        content:
          "Encomendas de medicamentos exigem certificado sanitário/INFARMED e licença de importação válida para Angola.",
        appliesToStatuses: ["EM_PROCUREMENT", "APROVADO"],
      },
      {
        title: "Processo geral de exportação",
        content:
          "1. Confirmar pedido com cliente. 2. Fazer procurement e comparar fornecedores. 3. Adjudicar. 4. Preparar documentação. 5. Reservar transitário. 6. Acompanhar envio até entrega.",
        appliesToStatuses: [],
      },
    ],
  });

  console.log(`Seed de demo concluído: ${suppliers.length} fornecedores, ${products.length} produtos, ${clients.length} clientes, ${totalOrders} pedidos.`);
  console.log(
    `Cenários garantidos — fornecedor único: ${singleSupplierAssigned}, preço abaixo do mercado: ${belowMarketAssigned}, cotação a expirar: ${expiringQuoteAssigned}.`,
  );
}
