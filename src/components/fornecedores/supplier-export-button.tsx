"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportSuppliersToExcelAction } from "@/server/actions/suppliers";

function downloadBase64(base64: string, filename: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SupplierExportButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const base64 = await exportSuppliersToExcelAction();
        downloadBase64(base64, "fornecedores.xlsx");
      } catch {
        toast.error("Não foi possível exportar. Só ADMIN pode exportar para Excel.");
      }
    });
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={isPending}>
      <Download className="size-4" />
      Exportar Excel
    </Button>
  );
}
