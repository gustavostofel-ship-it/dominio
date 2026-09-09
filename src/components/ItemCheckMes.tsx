"use client";

import { useTransition } from "react";
import { alternarStatusParcela } from "@/app/actions/parcelas";
import { definirStatusOcorrenciaDividaFixa } from "@/app/actions/dividas-fixas-status";
import { formatarBRL, type ItemProjecao } from "@/lib/calc";

export function ItemCheckMes({ item, mes }: { item: ItemProjecao; mes: string }) {
  const [pending, startTransition] = useTransition();
  const jaPago = item.status !== "pendente";

  function alternar() {
    const formData = new FormData();
    const novoStatus = jaPago ? "pendente" : "pago_no_mes";

    if (item.origem === "parcela") {
      formData.set("id", item.id);
      formData.set("novo_status", novoStatus);
      startTransition(() => {
        alternarStatusParcela(formData);
      });
    } else {
      const [dividaFixaId] = item.id.split("|");
      formData.set("divida_fixa_id", dividaFixaId);
      formData.set("mes_referencia", mes);
      formData.set("novo_status", novoStatus);
      startTransition(() => {
        definirStatusOcorrenciaDividaFixa(formData);
      });
    }
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
      <label className="flex flex-1 items-center gap-3">
        <input type="checkbox" checked={jaPago} disabled={pending} onChange={alternar} className="h-4 w-4 accent-verde-600" />
        <span className={jaPago ? "text-foreground-muted line-through" : ""}>{item.nome}</span>
      </label>
      <span className="font-semibold">{formatarBRL(item.valorCentavos)}</span>
    </li>
  );
}
