import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PackingListPdf } from "@/lib/pdf/packing-list";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const orderId = request.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId é obrigatório." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      client: true,
      items: { include: { variant: { include: { product: true } }, supplier: true } },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  const items = order.items.map((item) => ({
    name: item.variant
      ? `${item.variant.product.name} — ${item.variant.name}`
      : item.freeTextProduct ?? "Produto",
    quantity: item.quantity,
    supplierName: item.supplier?.name ?? null,
  }));

  const buffer = await renderToBuffer(
    <PackingListPdf reference={order.reference} clientName={order.client.name} items={items} />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${order.reference}-packing-list.pdf"`,
    },
  });
}
