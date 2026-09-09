"use client";

import { useState } from "react";
import Link from "next/link";
import { atualizarCartao, arquivarCartao } from "@/app/actions/cartoes";
import { FormComErro } from "@/components/FormComErro";
import { SubmitButton } from "@/components/SubmitButton";
import { Campo } from "@/components/Campo";
import type { CartaoRow } from "@/types/database";

export function CartaoLinha({ cartao }: { cartao: CartaoRow }) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <li className="rounded-lg border border-border p-4">
        <FormComErro action={atualizarCartao} onSucesso={() => setEditando(false)} className="grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="id" value={cartao.id} />
          <Campo label="Nome" name="nome" defaultValue={cartao.nome} required />
          <Campo label="Fechamento" name="dia_fechamento" type="number" min={1} max={31} defaultValue={cartao.dia_fechamento} required />
          <Campo label="Vencimento" name="dia_vencimento" type="number" min={1} max={31} defaultValue={cartao.dia_vencimento} required />
          <div className="flex gap-2 sm:col-span-3">
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
          {cartao.nome} {!cartao.ativo && <span className="text-xs text-foreground-muted">(arquivado)</span>}
        </p>
        <p className="text-xs text-foreground-muted">
          Fecha dia {cartao.dia_fechamento} · Vence dia {cartao.dia_vencimento}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href={`/cartoes/${cartao.id}`} className="text-sm font-medium text-verde-700 hover:underline">
          Ver fatura
        </Link>
        <button onClick={() => setEditando(true)} className="text-sm font-medium text-verde-700 hover:underline">
          Editar
        </button>
        {cartao.ativo && (
          <form
            action={async (formData) => {
              await arquivarCartao(formData);
            }}
          >
            <input type="hidden" name="id" value={cartao.id} />
            <button type="submit" className="text-sm font-medium text-foreground-muted hover:underline">
              Arquivar
            </button>
          </form>
        )}
      </div>
    </li>
  );
}
