"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { getPhcConnector } from "@/lib/phc";

export async function importPhcClientsAction(base64: string) {
  const user = await requireUser();
  const result = await getPhcConnector().importClients(base64, user.id);
  revalidatePath("/clientes");
  return result;
}

export async function importPhcProductsAction(base64: string) {
  const user = await requireUser();
  const result = await getPhcConnector().importProducts(base64, user.id);
  revalidatePath("/produtos");
  return result;
}
