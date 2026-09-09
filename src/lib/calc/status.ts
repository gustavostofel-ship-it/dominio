export type StatusFinanceiro = "verde" | "amarelo" | "vermelho";

export interface CalcularStatusInput {
  /** Soma das dívidas pendentes do mês (já excluindo itens de terceiros). */
  dividasPendentesCentavos: number;
  /** Renda mensal esperada, configurada pelo usuário. */
  rendaMensalEsperadaCentavos: number;
  /** % da renda até onde o status é considerado "verde". Ex.: 60. */
  faixaVerdePct: number;
  /** % da renda até onde o status é considerado "amarelo". Ex.: 90. */
  faixaAmarelaPct: number;
}

/**
 * Regra de cálculo #4: compara dívidas do mês (exceto as de terceiros) com
 * a renda mensal esperada, usando faixas configuráveis (nunca fixas em
 * código).
 *
 * - renda <= 0 é sempre vermelho (não há como calcular percentual).
 * - percentual = dividas / renda * 100
 * - <= faixaVerdePct        => verde
 * - <= faixaAmarelaPct      => amarelo
 * - > faixaAmarelaPct       => vermelho
 */
export function calcularStatusFinanceiro(input: CalcularStatusInput): StatusFinanceiro {
  const { dividasPendentesCentavos, rendaMensalEsperadaCentavos, faixaVerdePct, faixaAmarelaPct } = input;

  if (rendaMensalEsperadaCentavos <= 0) {
    return "vermelho";
  }

  const percentual = (dividasPendentesCentavos / rendaMensalEsperadaCentavos) * 100;

  if (percentual <= faixaVerdePct) return "verde";
  if (percentual <= faixaAmarelaPct) return "amarelo";
  return "vermelho";
}
