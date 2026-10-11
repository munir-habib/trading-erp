export const ORDER_STATUS_LABELS: Record<string, string> = {
  PEDIDO_RECEBIDO: "Pedido recebido",
  EM_PROCUREMENT: "Em procurement",
  COTACAO_ENVIADA: "Cotação enviada",
  APROVADO: "Aprovado",
  EM_TRANSITO: "Em trânsito",
  ENTREGUE: "Entregue",
  NAO_AVANCOU: "Não avançou",
};

export const ORDER_STATUS_ORDER = [
  "PEDIDO_RECEBIDO",
  "EM_PROCUREMENT",
  "COTACAO_ENVIADA",
  "APROVADO",
  "EM_TRANSITO",
  "ENTREGUE",
  "NAO_AVANCOU",
] as const;

/** Cor própria e consistente por estado do pipeline (badges em toda a app). */
export const ORDER_STATUS_COLORS: Record<string, string> = {
  PEDIDO_RECEBIDO: "#8A9690",
  EM_PROCUREMENT: "#E8A33D",
  COTACAO_ENVIADA: "#2C6E7F",
  APROVADO: "#3DDC84",
  EM_TRANSITO: "#4FD1B0",
  ENTREGUE: "#1F8B4C",
  NAO_AVANCOU: "#E85D4A",
};

export const NAO_AVANCOU_MOTIVO_LABELS: Record<string, string> = {
  PRECO: "Preço",
  PRAZO: "Prazo",
  CLIENTE_DESISTIU: "Cliente desistiu",
  PRODUTO_INDISPONIVEL: "Produto indisponível",
  CONCORRENCIA: "Concorrência",
  OUTRO: "Outro",
};

export function nextSuggestedStep(status: string): string {
  switch (status) {
    case "PEDIDO_RECEBIDO":
      return "Iniciar procurement: adicionar produtos e pedir cotações aos fornecedores.";
    case "EM_PROCUREMENT":
      return "Registar as cotações recebidas e comparar preços na tabela de picagem.";
    case "COTACAO_ENVIADA":
      return "Aguardar aprovação do cliente ou registar adjudicação.";
    case "APROVADO":
      return "Preparar documentação de exportação e reservar transitário.";
    case "EM_TRANSITO":
      return "Acompanhar datas de chegada com o transitário.";
    case "ENTREGUE":
      return "Registar avaliação do(s) fornecedor(es) desta encomenda.";
    case "NAO_AVANCOU":
      return "Pedido arquivado — sem mais ações.";
    default:
      return "";
  }
}

export function daysOpen(createdAt: Date | string): number {
  const created = new Date(createdAt).getTime();
  return Math.max(0, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)));
}
