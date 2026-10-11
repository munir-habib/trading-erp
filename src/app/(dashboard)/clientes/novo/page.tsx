import { redirect } from "next/navigation";
import { ClientForm } from "@/components/clientes/client-form";
import { createClientAction } from "@/server/actions/clients";

async function action(formData: FormData) {
  "use server";
  const client = await createClientAction(formData);
  redirect(`/clientes/${client.id}`);
}

export default function NovoClientePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Novo cliente</h1>
      <ClientForm action={action} />
    </div>
  );
}
