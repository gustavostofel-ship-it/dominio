/**
 * Toda aritmetica monetaria e feita em CENTAVOS (inteiros).
 * Nunca usar float para dinheiro - conversao para reais so na exibicao.
 */

/** Converte um valor em reais (ex.: digitado pelo usuario) para centavos inteiros. */
export function reaisParaCentavos(valorEmReais: number): number {
  if (!Number.isFinite(valorEmReais)) {
    throw new Error(`valor invalido: ${valorEmReais}`);
  }
  // Arredonda para o centavo mais proximo evitando erro de ponto flutuante
  // (ex.: 19.9 * 100 = 1989.9999999999998 em JS).
  return Math.round(valorEmReais * 100);
}

export function centavosParaReais(valorEmCentavos: number): number {
  return valorEmCentavos / 100;
}

/** Formata centavos como "R$ 1.234,56". */
export function formatarBRL(valorEmCentavos: number): string {
  const formatado = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavosParaReais(valorEmCentavos));
  // O Intl insere um espaco nao-quebravel (U+00A0) ou fino (U+202F) entre
  // "R$" e o valor. Normalizamos para um espaco comum, previsivel em testes
  // e ao copiar/colar o texto.
  return formatado.replace(/[\u00A0\u202F]/g, " ");
}

export function somarCentavos(...valores: number[]): number {
  return valores.reduce((total, v) => total + Math.trunc(v), 0);
}
