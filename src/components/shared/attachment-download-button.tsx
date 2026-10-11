"use client";

import { useTransition } from "react";
import { Download, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getAttachmentUrlAction, deleteAttachmentAction } from "@/server/actions/attachments";

interface Target {
  orderId?: string;
  supplierId?: string;
  clientId?: string;
}

export function AttachmentActions({ id, target }: { id: string; target: Target }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const url = await getAttachmentUrlAction(id);
            window.open(url, "_blank");
          })
        }
      >
        <Download className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await deleteAttachmentAction(id, target);
            router.refresh();
          })
        }
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
