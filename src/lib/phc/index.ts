import type { PhcConnector } from "@/lib/phc/connector";
import { ManualCsvConnector } from "@/lib/phc/manual-csv-connector";

export type { PhcConnector, PhcImportResult } from "@/lib/phc/connector";

/**
 * Fábrica do conector PHC. Hoje devolve sempre o baseline manual; trocar por
 * `RestApiConnector`/`DirectDbConnector` aqui (ou via variável de ambiente
 * `PHC_CONNECTOR_MODE`) não exige alterações no resto do sistema.
 */
export function getPhcConnector(): PhcConnector {
  return new ManualCsvConnector();
}
