/** "Criado por X em nome de Y" — usado em cartões, listas e detalhe. Sem dependências de servidor: seguro em client components. */
export function formatCreatedBy(
  createdBy: { name: string } | null | undefined,
  onBehalfOf?: { name: string } | null,
) {
  if (!createdBy) return "";
  if (onBehalfOf) return `${createdBy.name} em nome de ${onBehalfOf.name}`;
  return createdBy.name;
}
