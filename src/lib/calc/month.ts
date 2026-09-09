/**
 * Utilidades de mês — tudo representado como string "YYYY-MM" para ser
 * determinístico e imune a fuso-horário/objetos Date.
 */

export type MesRef = string; // "YYYY-MM"

const MES_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export function assertMesRef(mes: string): asserts mes is MesRef {
  if (!MES_REGEX.test(mes)) {
    throw new Error(`mesReferencia inválido: "${mes}". Formato esperado: YYYY-MM`);
  }
}

export function mesAtual(hoje: Date = new Date()): MesRef {
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth() + 1;
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

/** Soma (ou subtrai) N meses a um mesRef, retornando um novo mesRef. */
export function somarMeses(mes: MesRef, quantidade: number): MesRef {
  assertMesRef(mes);
  const [anoStr, mesStr] = mes.split("-");
  const ano = Number(anoStr);
  const mesNum = Number(mesStr);

  const totalMeses = ano * 12 + (mesNum - 1) + quantidade;
  const novoAno = Math.floor(totalMeses / 12);
  const novoMes = (totalMeses % 12) + 1;

  return `${novoAno}-${String(novoMes).padStart(2, "0")}`;
}

/** Compara dois mesRef: negativo se a < b, 0 se iguais, positivo se a > b. */
export function compararMes(a: MesRef, b: MesRef): number {
  assertMesRef(a);
  assertMesRef(b);
  return a.localeCompare(b);
}

export function mesEhAnteriorOuIgual(a: MesRef, b: MesRef): boolean {
  return compararMes(a, b) <= 0;
}

/** Gera uma lista de N mesRef consecutivos a partir de (e incluindo) mesInicio. */
export function gerarSequenciaDeMeses(mesInicio: MesRef, quantidade: number): MesRef[] {
  assertMesRef(mesInicio);
  return Array.from({ length: quantidade }, (_, i) => somarMeses(mesInicio, i));
}

/** Converte uma data (YYYY-MM-DD ou Date) para mesRef "YYYY-MM". */
export function dataParaMesRef(data: string | Date): MesRef {
  if (typeof data === "string") {
    return data.slice(0, 7);
  }
  return mesAtual(data);
}
