"use client";

import { useState } from "react";
import { atualizarCompra, excluirCompra } from "@/app/actions/compras";
import { FormComErro } from "@/components/FormComErro";
import { SubmitButton } from "@/components/SubmitButton";
import { Campo } from "@/components/Campo";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";
import { SeletorResponsavel } from "@/components/SeletorResponsavel";
import { formatarBRL } from "@/lib/calc";
import type { CartaoRow, CompraRow, ParcelaRow } from "@/types/database";

export function CompraCard({
  compra,
  parcelas,
  cartoes,
  nomeCriador,
}: {
  compra: CompraRow;
  parcelas: ParcelaRow[];
  cartoes: CartaoRow[];
  nomeCriador: string;
}) {
  const [editando, setEditando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const ehTerceiro = compra.atribuido_a !== "eu";
  const ps = [...parcelas].sort((a, b) => a.numero_da_parcela - b.numero_da_parcela);

  if (editando) {
    return (
      <div className="card p-5">
        <FormComErro action={atualizarCompra} onSucesso={() => setEditando(false)} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={compra.id} />
          <label className="flex flex-col gap-1 text-sm font-medium">
            Cartão
            <select
              name="cartao_id"
              defaultValue={compra.cartao_id}
              required
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-verde-500 focus:ring-2 focus:ring-verde-100"
            >
              {cartoes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <Campo label="Descrição" name="descricao" defaultValue={compra.descricao} required />
          <CampoValorMonetario
            label="Valor total"
            name="valor"
            defaultValueReais={compra.valor_total_centavos / 100}
            required
          />
          <Campo
            label="Número de parcelas"
            name="numero_parcelas"
            type="number"
            min={1}
            defaultValue={compra.numero_parcelas}
            required
          />
          <Campo
            label="Mês de início"
            name="mes_inicio"
            type="month"
            defaultValue={compra.mes_inicio.slice(0, 7)}
            required
          />
          <SeletorResponsavel valorInicial={compra.atribuido_a} />
          <p className="text-xs text-foreground-muted sm:col-span-2">
            Atenção: editar recalcula todas as parcelas do zero — qualquer parcela já marcada como
            paga ou quitada antecipadamente volta para pendente.
          </p>
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
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">
            {compra.descricao}
            {ehTerceiro && <span className="ml-2 status-pill status-pill--amarelo">de {compra.atribuido_a}</span>}
          </p>
          <p className="text-xs text-foreground-muted">
            Lançado por {nomeCriador} em {new Date(compra.criado_em).toLocaleDateString("pt-BR")} ·{" "}
            {compra.numero_parcelas}x
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-semibold">{formatarBRL(compra.valor_total_centavos)}</p>
          <button onClick={() => setEditando(true)} className="text-sm font-medium text-verde-700 hover:underline">
            Editar
          </button>
          {confirmandoExclusao ? (
            <form
              action={async (formData) => {
                await excluirCompra(formData);
              }}
              className="flex items-center gap-1"
            >
              <input type="hidden" name="id" value={compra.id} />
              <span className="text-xs text-vermelho-600">Excluir de vez?</span>
              <button type="submit" className="text-sm font-medium text-vermelho-600 hover:underline">
                Sim
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoExclusao(false)}
                className="text-sm font-medium text-foreground-muted hover:underline"
              >
                Não
              </button>
            </form>
          ) : (
            <button
              onClick={() => setConfirmandoExclusao(true)}
              className="text-sm font-medium text-foreground-muted hover:underline"
            >
              Excluir
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {ps.map((p) => (
          <span
            key={p.id}
            className={`status-pill ${p.status === "pendente" ? "status-pill--amarelo" : "status-pill--verde"}`}
          >
            {p.mes_referencia.slice(0, 7)} · {formatarBRL(p.valor_centavos)}
          </span>
        ))}
      </div>
    </div>
  );
}
