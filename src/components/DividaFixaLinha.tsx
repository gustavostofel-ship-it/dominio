"use client";

import { useState } from "react";
import { atualizarDividaFixa, arquivarDividaFixa } from "@/app/actions/dividas-fixas";
import { FormComErro } from "@/components/FormComErro";
import { SubmitButton } from "@/components/SubmitButton";
import { Campo } from "@/components/Campo";
import { formatarBRL } from "@/lib/calc";
import type { DividaFixaRow } from "@/types/database";

export function DividaFixaLinha({ divida }: { divida: DividaFixaRow }) {
  const [editando, setEditando] = useState(false);
  const ehDeTerceiro = divida.atribuido_a !== "eu";

  if (editando) {
    return (
      <li className="rounded-lg border border-border p-4">
        <FormComErro action={atualizarDividaFixa} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={divida.id} />
          <Campo label="Nome" name="nome" defaultValue={divida.nome} required />
          <Campo label="Valor (R$)" name="valor" type="number" step="0.01" min="0.01" defaultValue={divida.valor_centavos / 100} required />
          <Campo label="Dia de vencimento" name="dia_vencimento" type="number" min={1} max={31} defaultValue={divida.dia_vencimento} required />
          <Campo label="Mês final (opcional)" name="mes_fim" type="month" defaultValue={divida.mes_fim?.slice(0, 7) ?? ""} />
          <Campo label="Atribuído a" name="atribuido_a" defaultValue={divida.atribuido_a} />
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="recorrente" defaultChecked={divida.recorrente} className="h-4 w-4 accent-verde-600" />
            Recorrente
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <SubmitButton>Salvar</SubmitButton>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
            >
              Cancelar
            </button>
          </div>
        </FormComErro>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <div>
        <p className="font-medium">
          {divida.nome} {!divida.ativo && <span className="text-xs text-foreground-muted">(arquivada)</span>}
          {ehDeTerceiro && <span className="ml-2 status-pill status-pill--amarelo">de {divida.atribuido_a}</span>}
        </p>
        <p className="text-xs text-foreground-muted">
          Vence dia {divida.dia_vencimento} · {divida.recorrente ? "recorrente" : "única"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold">{formatarBRL(divida.valor_centavos)}</span>
        <button onClick={() => setEditando(true)} className="text-sm font-medium text-verde-700 hover:underline">
          Editar
        </button>
        {divida.ativo && (
          <form
            action={async (formData) => {
              await arquivarDividaFixa(formData);
            }}
          >
            <input type="hidden" name="id" value={divida.id} />
            <button type="submit" className="text-sm font-medium text-foreground-muted hover:underline">
              Arquivar
            </button>
          </form>
        )}
      </div>
    </li>
  );
}
