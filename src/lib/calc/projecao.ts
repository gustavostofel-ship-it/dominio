import type { MesRef } from "./month";
import type { StatusItem } from "./dividas-fixas";

export const RESPONSAVEL_PROPRIO = "eu" as const;

export interface ItemProjecao {
  origem: "parcela" | "divida_fixa";
  id: string;
  nome: string;
  mesReferencia: MesRef;
  valorCentavos: number;
  status: StatusItem;
  atribuidoA: string; // "eu" | nome de terceiro
}

export interface ResumoMes {
  mesReferencia: MesRef;
  /** O que o usuário deve neste mês (pendente, exclui itens de terceiros). */
  totalDevidoCentavos: number;
  /** Total já pago no mês (informativo, não entra no status de saúde). */
  totalPagoCentavos: number;
  /** Total de itens que são 100% de responsabilidade de terceiros (não conta pro usuário). */
  totalTerceirosCentavos: number;
  itens: ItemProjecao[];
}

function ehDoProprioUsuario(atribuidoA: string): boolean {
  return atribuidoA === RESPONSAVEL_PROPRIO;
}

/**
 * Regra de cálculo #2: projeção soma, por mês, parcelas de cartão pendentes
 * + dívidas fixas do mês pendentes, EXCLUINDO qualquer item cujo
 * atribuido_a seja diferente de "eu" (dívida de terceiro). Divisões
 * parciais de gasto (a receber) nunca entram aqui — são tratadas à parte.
 */
export function calcularResumoPorMes(itens: ItemProjecao[], meses: MesRef[]): ResumoMes[] {
  return meses.map((mesReferencia) => {
    const itensDoMes = itens.filter((i) => i.mesReferencia === mesReferencia);

    const doUsuario = itensDoMes.filter((i) => ehDoProprioUsuario(i.atribuidoA));
    const deTerceiros = itensDoMes.filter((i) => !ehDoProprioUsuario(i.atribuidoA));

    const totalDevidoCentavos = doUsuario
      .filter((i) => i.status === "pendente")
      .reduce((acc, i) => acc + i.valorCentavos, 0);

    const totalPagoCentavos = doUsuario
      .filter((i) => i.status !== "pendente")
      .reduce((acc, i) => acc + i.valorCentavos, 0);

    const totalTerceirosCentavos = deTerceiros.reduce((acc, i) => acc + i.valorCentavos, 0);

    return {
      mesReferencia,
      totalDevidoCentavos,
      totalPagoCentavos,
      totalTerceirosCentavos,
      itens: itensDoMes,
    };
  });
}
