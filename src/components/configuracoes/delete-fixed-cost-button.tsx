"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteFixedCostAction } from "@/server/actions/fixed-costs";

export function DeleteFixedCostButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteFixedCostAction(id);
          router.refresh();
        })
      }
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}
