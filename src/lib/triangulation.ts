const EU_COUNTRIES = new Set([
  "Portugal", "Espanha", "França", "Alemanha", "Itália", "Países Baixos",
  "Bélgica", "Áustria", "Polónia", "Suécia", "Dinamarca", "Finlândia",
  "Irlanda", "Grécia", "República Checa", "Hungria", "Roménia", "Bulgária",
  "Eslováquia", "Eslovénia", "Croácia", "Luxemburgo", "Estónia", "Letónia",
  "Lituânia", "Malta", "Chipre",
]);

const HIGH_VALUE_THRESHOLD = 10000;

export function isTriangulationCandidate({
  orderValue,
  supplierCountries,
  clientCountry,
}: {
  orderValue: number;
  supplierCountries: (string | null)[];
  clientCountry: string | null;
}) {
  if (orderValue < HIGH_VALUE_THRESHOLD) return false;
  const hasEuSupplier = supplierCountries.some((c) => c && EU_COUNTRIES.has(c));
  const clientOutsideEu = !clientCountry || !EU_COUNTRIES.has(clientCountry);
  return hasEuSupplier && clientOutsideEu;
}
