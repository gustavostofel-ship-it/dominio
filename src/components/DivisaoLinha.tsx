"use client";

import { useOptimistic, useTransition } from "react";
import { marcarDivisaoRecebida, marcarDivisaoAReceber } from "@/app/actions/divisoes";
import { formatarBRL } from "@/lib/calc";
import type { DivisaoGastoRow } from "@/types/database";

export function DivisaoLinha({
  divisao,
  descricaoCompra,
}: {
  divisao: DivisaoGastoRow;
  descricaoCompra?: string;
}) {
  const [, startTransition] = useTransition();
  const recebidoReal = divisao.status === "recebido";
  const [recebidoOtimista, marcarOtimista] = useOptimistic(recebidoReal);

  function alternar() {
    const novoValor = !recebidoOtimista;
    const formData = new FormData();
    formData.set("id", divisao.id);

    startTransition(async () => {
      marcarOtimista(novoValor);
      await (novoValor ? marcarDivisaoRecebida : marcarDivisaoAReceber)(formData);
    });
  }

  return (
    <li className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
      <div>
        <p className={recebidoOtimista ? "text-foreground-muted line-through" : ""}>
          {descricaoCompra ?? "(compra removida)"}
        </p>
        <p className="text-xs text-foreground-muted">Referente a {divisao.mes_referencia.slice(0, 7)}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold">{formatarBRL(divisao.valor_centavos)}</span>
        <button
          onClick={alternar}
          className="rounded-lg border border-border px-3 py-1 text-xs font-medium hover:bg-surface-muted"
        >
          {recebidoOtimista ? "Marcar a receber" : "Marcar recebido"}
        </button>
      </div>
    </li>
  );
}
