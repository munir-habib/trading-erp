import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PurchaseOrderPdf } from "@/lib/pdf/purchase-order";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const orderId = request.nextUrl.searchParams.get("orderId");
  const supplierId = request.nextUrl.searchParams.get("supplierId");
  if (!orderId || !supplierId) {
    return NextResponse.json({ error: "orderId e supplierId são obrigatórios." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        where: { supplierId },
        include: { variant: { include: { product: true } } },
      },
    },
  });
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!order || !supplier) {
    return NextResponse.json({ error: "Pedido ou fornecedor não encontrado." }, { status: 404 });
  }

  const items = order.items.map((item) => ({
    name: item.variant
      ? `${item.variant.product.name} — ${item.variant.name}`
      : item.freeTextProduct ?? "Produto",
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    currency: item.currency,
  }));

  const buffer = await renderToBuffer(
    <PurchaseOrderPdf reference={order.reference} supplierName={supplier.name} items={items} />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${order.reference}-${supplier.name.replace(/[^a-z0-9]+/gi, "-")}.pdf"`,
    },
  });
}
