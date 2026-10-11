"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { z } from "zod";

const noteSchema = z.object({
  channel: z.enum(["EMAIL", "WHATSAPP", "CHAMADA", "REUNIAO"]),
  content: z.string().min(1, "Escreve uma nota."),
  onBehalfOfId: z.string().optional().or(z.literal("")),
});

export async function addOrderNoteAction(orderId: string, formData: FormData) {
  const user = await requireUser();
  const data = noteSchema.parse({
    channel: formData.get("channel"),
    content: formData.get("content"),
    onBehalfOfId: formData.get("onBehalfOfId"),
  });
  const onBehalfOfId =
    user.role === "ADMIN" && data.onBehalfOfId ? data.onBehalfOfId : null;

  await prisma.orderNote.create({
    data: {
      orderId,
      channel: data.channel,
      content: data.content,
      createdById: user.id,
      onBehalfOfId,
    },
  });

  revalidatePath(`/pedidos/${orderId}`);
}
