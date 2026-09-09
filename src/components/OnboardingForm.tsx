"use client";

import { useState } from "react";
import { criarCompraOnboarding } from "@/app/actions/compras";
import { Campo } from "@/components/Campo";
import { mesAtual } from "@/lib/calc";
import type { CartaoRow } from "@/types/database";

interface DividaLancada {
  cartao: string;
  valor: string;
  parcelas: string;
}

export function OnboardingForm({ cartoes }: { cartoes: CartaoRow[] }) {
  const [lancadas, setLancadas] = useState<DividaLancada[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoSubmeter(formData: FormData) {
    setErro(null);
    setEnviando(true);

    const cartaoId = String(formData.get("cartao_id"));
    const cartaoNome = cartoes.find((c) => c.id === cartaoId)?.nome ?? "";

    const resultado = await criarCompraOnboarding(formData);
    setEnviando(false);

    if (resultado?.erro) {
      setErro(resultado.erro);
      return;
    }

    setLancadas((atual) => [
      ...atual,
      {
        cartao: cartaoNome,
        valor: String(formData.get("valor")),
        parcelas: String(formData.get("numero_parcelas")),
      },
    ]);
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={aoSubmeter} className="card grid gap-4 p-6 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Cartão
          <select
            name="cartao_id"
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
        <Campo label="Valor total restante (R$)" name="valor" type="number" step="0.01" min="0.01" required />
        <Campo label="Parcelas restantes" name="numero_parcelas" type="number" min={1} defaultValue={1} required />
        <input type="hidden" name="mes_inicio" value={mesAtual()} />
        <Campo
          label="Nome (opcional)"
          name="descricao"
          placeholder='Deixe em branco para "Dívida migrada da planilha"'
          className="sm:col-span-2"
        />

        {erro && (
          <p className="rounded-lg bg-vermelho-100 px-3 py-2 text-sm text-vermelho-700 sm:col-span-2">{erro}</p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-fit rounded-lg bg-verde-600 px-6 py-2 text-sm font-semibold text-white hover:bg-verde-700 disabled:opacity-60 sm:col-span-2"
        >
          {enviando ? "Salvando..." : "Adicionar e continuar"}
        </button>
      </form>

      {lancadas.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold">Já cadastradas nesta sessão ({lancadas.length})</h2>
          <ul className="mt-3 flex flex-col gap-1 text-sm text-foreground-muted">
            {lancadas.map((l, i) => (
              <li key={i}>
                {l.cartao} — R$ {l.valor} em {l.parcelas}x
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
