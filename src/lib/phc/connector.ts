export interface PhcImportResult {
  imported: number;
  errors: string[];
}

/**
 * Camada de serviço isolada para a integração com o PHC. Enquanto não há acesso
 * confirmado, usa-se `ManualCsvConnector` (baseline funcional). Quando o nível de
 * acesso for definido, `RestApiConnector` ou `DirectDbConnector` substituem-no sem
 * alterar o resto do sistema (mesma interface).
 */
export interface PhcConnector {
  importClients(fileBase64: string, userId: string): Promise<PhcImportResult>;
  importProducts(fileBase64: string, userId: string): Promise<PhcImportResult>;
}
