import type { PhcConnector, PhcImportResult } from "@/lib/phc/connector";

/**
 * Opção 2: leitura periódica (read-only) direta à base de dados SQL do PHC.
 * Por implementar assim que o acesso à BD estiver confirmado.
 */
export class DirectDbConnector implements PhcConnector {
  async importClients(): Promise<PhcImportResult> {
    throw new Error("DirectDbConnector ainda não implementado — falta acesso à BD do PHC.");
  }

  async importProducts(): Promise<PhcImportResult> {
    throw new Error("DirectDbConnector ainda não implementado — falta acesso à BD do PHC.");
  }
}
