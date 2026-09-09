import { gerarSequenciaDeMeses, type MesRef } from "./month";

export type StatusParcela = "pendente" | "pago_no_mes" | "quitado_antecipado";

export interface ParcelaGerada {
  numeroDaParcela: number;
  mesReferencia: MesRef;
  valorCentavos: number;
}

export interface GerarParcelasInput {
  valorTotalCentavos: number;
  numeroParcelas: number;
  mesInicio: MesRef;
}

/**
 * Regra de cálculo #1: divide valorTotalCentavos em numeroParcelas parcelas
 * inteiras (centavos). A divisão nunca é exata em todos os casos — a
 * diferença de arredondamento é sempre absorvida pela ÚLTIMA parcela, para
 * que a soma das parcelas seja sempre EXATAMENTE igual ao valor total
 * (nunca se perde nem sobra centavo).
 */
export function gerarParcelas(input: GerarParcelasInput): ParcelaGerada[] {
  const { valorTotalCentavos, numeroParcelas, mesInicio } = input;

  if (!Number.isInteger(valorTotalCentavos) || valorTotalCentavos <= 0) {
    throw new Error(`valorTotalCentavos deve ser um inteiro positivo, recebido: ${valorTotalCentavos}`);
  }
  if (!Number.isInteger(numeroParcelas) || numeroParcelas < 1) {
    throw new Error(`numeroParcelas deve ser um inteiro >= 1, recebido: ${numeroParcelas}`);
  }

  const valorBase = Math.floor(valorTotalCentavos / numeroParcelas);
  const resto = valorTotalCentavos - valorBase * numeroParcelas;

  const meses = gerarSequenciaDeMeses(mesInicio, numeroParcelas);

  const parcelas: ParcelaGerada[] = meses.map((mesReferencia, i) => ({
    numeroDaParcela: i + 1,
    mesReferencia,
    valorCentavos: valorBase,
  }));

  // A diferença de arredondamento vai inteira para a última parcela.
  parcelas[parcelas.length - 1].valorCentavos += resto;

  return parcelas;
}

/** Invariante de auditoria: a soma das parcelas geradas bate com o valor total. */
export function validarSomaParcelas(parcelas: ParcelaGerada[], valorTotalCentavos: number): boolean {
  const soma = parcelas.reduce((acc, p) => acc + p.valorCentavos, 0);
  return soma === valorTotalCentavos;
}
