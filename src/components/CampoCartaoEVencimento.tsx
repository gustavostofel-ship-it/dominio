"use client";

import { useState } from "react";
import { Campo } from "@/components/Campo";
import type { CartaoRow } from "@/types/database";

/**
 * "Cobrada em algum cartão?" + "Dia de vencimento" combinados: se a dívida
 * fixa é cobrada num cartão, o vencimento já é o vencimento cadastrado
 * nesse cartão — perguntar o dia de novo é redundante e só gera
 * inconsistência (o usuário digitando um dia diferente do cartão de
 * verdade). Só pede o dia manualmente quando não tem cartão vinculado
 * (paga direto: boleto, débito, etc.).
 */
export function CampoCartaoEVencimento({ cartoes }: { cartoes: CartaoRow[] }) {
  const [cartaoId, setCartaoId] = useState("");
  const cartao = cartoes.find((c) => c.id === cartaoId);

  if (cartoes.length === 0) {
    return (
      <Campo label="Dia de vencimento" name="dia_vencimento" type="number" min={1} max={31} required />
    );
  }

  return (
    <>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Cobrada em algum cartão? (opcional)
        <select
          name="cartao_id"
          value={cartaoId}
          onChange={(e) => setCartaoId(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-verde-500 focus:ring-2 focus:ring-verde-100"
        >
          <option value="">Não — é paga direto (boleto, débito, etc.)</option>
          {cartoes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>

      {cartao ? (
        <div className="flex flex-col gap-1 text-sm font-medium">
          Dia de vencimento
          <p className="rounded-lg border border-dashed border-border bg-surface-muted px-3 py-2 text-sm font-normal text-foreground-muted">
            Dia {cartao.dia_vencimento} — mesmo vencimento do cartão {cartao.nome}
          </p>
          <input type="hidden" name="dia_vencimento" value={cartao.dia_vencimento} />
        </div>
      ) : (
        <Campo label="Dia de vencimento" name="dia_vencimento" type="number" min={1} max={31} required />
      )}
    </>
  );
}
