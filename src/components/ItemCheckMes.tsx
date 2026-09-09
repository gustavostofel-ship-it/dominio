"use client";

import { useOptimistic, useTransition } from "react";
import { alternarStatusParcela } from "@/app/actions/parcelas";
import { definirStatusOcorrenciaDividaFixa } from "@/app/actions/dividas-fixas-status";
import { formatarBRL, type ItemProjecao } from "@/lib/calc";

export function ItemCheckMes({ item, mes }: { item: ItemProjecao; mes: string }) {
  const [, startTransition] = useTransition();
  const jaPagoReal = item.status !== "pendente";
  // Atualização otimista: o checkbox reage na hora do clique, sem esperar
  // a volta do servidor. Assim que o servidor confirma e a página revalida,
  // o valor real assume — se a ação falhar, volta sozinho ao estado anterior.
  const [jaPagoOtimista, marcarOtimista] = useOptimistic(jaPagoReal);

  function alternar() {
    const novoValor = !jaPagoOtimista;
    const novoStatus = novoValor ? "pago_no_mes" : "pendente";
    const formData = new FormData();

    startTransition(async () => {
      marcarOtimista(novoValor);
      if (item.origem === "parcela") {
        formData.set("id", item.id);
        formData.set("novo_status", novoStatus);
        await alternarStatusParcela(formData);
      } else {
        const [dividaFixaId] = item.id.split("|");
        formData.set("divida_fixa_id", dividaFixaId);
        formData.set("mes_referencia", mes);
        formData.set("novo_status", novoStatus);
        await definirStatusOcorrenciaDividaFixa(formData);
      }
    });
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
      <label className="flex flex-1 items-center gap-3">
        <input
          type="checkbox"
          checked={jaPagoOtimista}
          onChange={alternar}
          className="h-4 w-4 accent-verde-600"
        />
        <span className={jaPagoOtimista ? "text-foreground-muted line-through" : ""}>{item.nome}</span>
      </label>
      <span className="font-semibold">{formatarBRL(item.valorCentavos)}</span>
    </li>
  );
}
