import { compararMes, type MesRef } from "./month";

export type StatusItem = "pendente" | "pago_no_mes" | "quitado_antecipado";

export interface DividaFixaDef {
  id: string;
  valorCentavos: number;
  recorrente: boolean;
  mesInicio: MesRef;
  mesFim: MesRef | null;
  atribuidoA: string; // "eu" | nome da pessoa
}

export interface OverrideStatusDividaFixa {
  dividaFixaId: string;
  mesReferencia: MesRef;
  status: StatusItem;
  dataPagamentoReal?: string | null;
}

export interface InstanciaDividaFixa {
  dividaFixaId: string;
  mesReferencia: MesRef;
  valorCentavos: number;
  status: StatusItem;
  atribuidoA: string;
}

/**
 * Uma dívida fixa recorrente sem mes_fim vale indefinidamente a partir do
 * mes_inicio. Uma dívida fixa não-recorrente vale só no próprio mes_inicio.
 * Com mes_fim definido, vale de mes_inicio até mes_fim (inclusive).
 */
export function dividaFixaAplicavelNoMes(divida: DividaFixaDef, mes: MesRef): boolean {
  if (compararMes(mes, divida.mesInicio) < 0) return false;

  if (!divida.recorrente) {
    return compararMes(mes, divida.mesInicio) === 0;
  }

  if (divida.mesFim && compararMes(mes, divida.mesFim) > 0) return false;

  return true;
}

/**
 * Materializa, para uma lista de meses, as instâncias mensais de cada
 * dívida fixa que se aplica, aplicando por cima qualquer status manual
 * (pago / quitado antecipado) já registrado. Sem override, o status
 * padrão é "pendente".
 */
export function gerarInstanciasDividasFixas(
  dividas: DividaFixaDef[],
  overrides: OverrideStatusDividaFixa[],
  meses: MesRef[]
): InstanciaDividaFixa[] {
  const mapaOverrides = new Map<string, OverrideStatusDividaFixa>();
  for (const o of overrides) {
    mapaOverrides.set(`${o.dividaFixaId}|${o.mesReferencia}`, o);
  }

  const instancias: InstanciaDividaFixa[] = [];

  for (const divida of dividas) {
    for (const mes of meses) {
      if (!dividaFixaAplicavelNoMes(divida, mes)) continue;

      const override = mapaOverrides.get(`${divida.id}|${mes}`);

      instancias.push({
        dividaFixaId: divida.id,
        mesReferencia: mes,
        valorCentavos: divida.valorCentavos,
        status: override?.status ?? "pendente",
        atribuidoA: divida.atribuidoA,
      });
    }
  }

  return instancias;
}
