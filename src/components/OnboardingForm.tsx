"use client";

import { useMemo, useState } from "react";
import { criarCompraOnboarding } from "@/app/actions/compras";
import { Campo } from "@/components/Campo";
import { SeletorResponsavel } from "@/components/SeletorResponsavel";
import { mesAtual } from "@/lib/calc";
import type { CartaoRow } from "@/types/database";

interface DividaLancada {
  cartao: string;
  valor: string;
  parcelas: string;
}

interface Divisao {
  nome: string;
  valor: string;
}

export function OnboardingForm({ cartoes }: { cartoes: CartaoRow[] }) {
  const [lancadas, setLancadas] = useState<DividaLancada[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [responsavel, setResponsavel] = useState("eu");
  const [divisoes, setDivisoes] = useState<Divisao[]>([]);
  // Muda a cada envio bem-sucedido só pra forçar o SeletorResponsavel a
  // remontar do zero (senão "Outro" + o nome digitado ficariam presos
  // depois de cadastrar a dívida seguinte).
  const [resetKey, setResetKey] = useState(0);

  const ehNos = responsavel === "eu";
  const divisoesJson = useMemo(
    () => JSON.stringify(divisoes.map((d) => ({ nome: d.nome, valor: Number(d.valor) }))),
    [divisoes]
  );

  function adicionarDivisao() {
    setDivisoes((atual) => [...atual, { nome: "", valor: "" }]);
  }

  function atualizarDivisao(index: number, campo: keyof Divisao, valor: string) {
    setDivisoes((atual) => atual.map((d, i) => (i === index ? { ...d, [campo]: valor } : d)));
  }

  function removerDivisao(index: number) {
    setDivisoes((atual) => atual.filter((_, i) => i !== index));
  }

  async function aoSubmeter(formData: FormData) {
    setErro(null);
    setEnviando(true);

    const cartaoId = String(formData.get("cartao_id"));
    const cartaoNome = cartoes.find((c) => c.id === cartaoId)?.nome ?? "";
    formData.set("divisoes_json", ehNos ? divisoesJson : "[]");

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
    setDivisoes([]);
    setResponsavel("eu");
    setResetKey((k) => k + 1);
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
        <Campo
          label="Mês da próxima parcela a pagar"
          name="mes_inicio"
          type="month"
          defaultValue={mesAtual()}
          required
        />
        <Campo
          label="Nome (opcional)"
          name="descricao"
          placeholder='Deixe em branco para "Dívida migrada da planilha"'
          className="sm:col-span-2"
        />

        <SeletorResponsavel key={resetKey} rotulo="De quem é essa dívida?" aoMudar={setResponsavel} />

        {ehNos && (
          <fieldset className="rounded-lg border border-border p-4 sm:col-span-2">
            <legend className="px-1 text-sm font-semibold">
              Uma parte é dividida com outra pessoa? (opcional)
            </legend>
            <div className="mt-2 flex flex-col gap-3">
              {divisoes.map((divisao, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={divisao.nome}
                    onChange={(e) => atualizarDivisao(index, "nome", e.target.value)}
                    placeholder="Nome da pessoa"
                    autoComplete="off"
                    required
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-verde-500 focus:ring-2 focus:ring-verde-100"
                  />
                  <input
                    value={divisao.valor}
                    onChange={(e) => atualizarDivisao(index, "valor", e.target.value)}
                    type="number"
                    step="0.01"
                    placeholder="Valor (R$)"
                    className="w-32 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-verde-500 focus:ring-2 focus:ring-verde-100"
                  />
                  <button
                    type="button"
                    onClick={() => removerDivisao(index)}
                    className="rounded-lg border border-border px-3 text-sm text-vermelho-600 hover:bg-vermelho-100"
                  >
                    Remover
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={adicionarDivisao}
                className="w-fit rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-muted"
              >
                + Adicionar pessoa
              </button>
            </div>
          </fieldset>
        )}

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
