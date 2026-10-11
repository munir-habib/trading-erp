import type { PhcConnector, PhcImportResult } from "@/lib/phc/connector";

/**
 * Opção 1 (mais automática): sincronização via API REST do PHC.
 * Por implementar assim que o nível de acesso à API estiver confirmado.
 */
export class RestApiConnector implements PhcConnector {
  async importClients(): Promise<PhcImportResult> {
    throw new Error("RestApiConnector ainda não implementado — falta acesso à API do PHC.");
  }

  async importProducts(): Promise<PhcImportResult> {
    throw new Error("RestApiConnector ainda não implementado — falta acesso à API do PHC.");
  }
}
