import { NewOrderForm } from "@/components/pedidos/new-order-form";
import { createOrderAction } from "@/server/actions/orders";
import { listClients } from "@/server/actions/clients";
import { listUsers } from "@/server/actions/users";
import { getCurrentUser } from "@/lib/session";

export default async function NovoPedidoPage() {
  const [clients, users, user] = await Promise.all([
    listClients(),
    listUsers(),
    getCurrentUser(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Novo pedido</h1>
      <NewOrderForm
        action={createOrderAction}
        clients={clients}
        users={users.filter((u) => u.id !== user?.id)}
        currentUserRole={user?.role ?? "USER"}
      />
    </div>
  );
}
