"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addOrderNoteAction } from "@/server/actions/notes";
import { formatCreatedBy } from "@/lib/format";

const CHANNEL_LABELS: Record<string, string> = {
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  CHAMADA: "Chamada",
  REUNIAO: "Reunião",
};

export interface OrderNoteData {
  id: string;
  channel: string;
  content: string;
  createdAt: string | Date;
  createdBy: { name: string };
  onBehalfOf: { name: string } | null;
}

export function OrderNotesSection({
  orderId,
  notes,
  users,
  currentUserRole,
}: {
  orderId: string;
  notes: OrderNoteData[];
  users: { id: string; name: string }[];
  currentUserRole: "ADMIN" | "USER";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await addOrderNoteAction(orderId, formData);
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">Mural de comunicações</h2>

      <form action={handleSubmit} className="hairline flex flex-col gap-3 rounded-lg p-3">
        <div className="flex flex-wrap gap-3">
          <Select name="channel" defaultValue="EMAIL">
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentUserRole === "ADMIN" && (
            <Select name="onBehalfOfId">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Em nome de (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Textarea
          name="content"
          rows={2}
          placeholder="Nota, decisão ou acontecimento..."
          required
        />
        <Button type="submit" size="sm" disabled={isPending} className="w-fit">
          Adicionar ao mural
        </Button>
      </form>

      {notes.length > 0 && (
        <div className="hairline overflow-hidden rounded-lg">
          {notes.map((note) => (
            <div key={note.id} className="hairline-b flex flex-col gap-1 px-3 py-2 text-sm last:border-b-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {CHANNEL_LABELS[note.channel]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatCreatedBy(note.createdBy, note.onBehalfOf)} ·{" "}
                  {new Date(note.createdAt).toLocaleString("pt-PT")}
                </span>
              </div>
              <p>{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
