"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { criarCompra } from "@/app/actions/compras";
import { Campo } from "@/components/Campo";
import { mesAtual } from "@/lib/calc";
import type { CartaoRow } from "@/types/database";

interface Divisao {
  nome: string;
  valor: string;
}

export function LancarGastoForm({ cartoes }: { cartoes: CartaoRow[] }) {
  const router = useRouter();
  const [tipoResponsavel, setTipoResponsavel] = useState<"eu" | "terceiro">("eu");
  const [nomeTerceiro, setNomeTerceiro] = useState("");
  const [divisoes, setDivisoes] = useState<Divisao[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const divisoesJson = useMemo(() => JSON.stringify(divisoes.map((d) => ({ nome: d.nome, valor: Number(d.valor) }))), [divisoes]);

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
    formData.set("atribuido_a", tipoResponsavel === "eu" ? "eu" : nomeTerceiro || "Terceiro");
    formData.set("divisoes_json", tipoResponsavel === "eu" ? divisoesJson : "[]");

    const resultado = await criarCompra(formData);
    setEnviando(false);
    if (resultado?.erro) {
      setErro(resultado.erro);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <form action={aoSubmeter} className="card flex flex-col gap-4 p-6">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Valor total (R$)" name="valor" type="number" step="0.01" min="0.01" required />
        <Campo label="Número de parcelas" name="numero_parcelas" type="number" min={1} defaultValue={1} required />
        <Campo label="Mês de início" name="mes_inicio" type="month" defaultValue={mesAtual()} required />
        <Campo label="Descrição" name="descricao" placeholder="Ex.: Shopee (casamento)" required className="sm:col-span-2" />
      </div>

      <fieldset className="rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold">De quem é esse gasto?</legend>
        <div className="mt-2 flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="_tipo_responsavel"
              checked={tipoResponsavel === "eu"}
              onChange={() => setTipoResponsavel("eu")}
              className="h-4 w-4 accent-verde-600"
            />
            É meu (conta no meu total)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="_tipo_responsavel"
              checked={tipoResponsavel === "terceiro"}
              onChange={() => setTipoResponsavel("terceiro")}
              className="h-4 w-4 accent-verde-600"
            />
            É 100% de outra pessoa (ex.: emprestei o cartão)
          </label>
          {tipoResponsavel === "terceiro" && (
            <input
              value={nomeTerceiro}
              onChange={(e) => setNomeTerceiro(e.target.value)}
              placeholder="Nome da pessoa"
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-verde-500 focus:ring-2 focus:ring-verde-100"
            />
          )}
        </div>
      </fieldset>

      {tipoResponsavel === "eu" && (
        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-semibold">Alguém vai te pagar uma parte? (opcional)</legend>
          <div className="mt-2 flex flex-col gap-3">
            {divisoes.map((divisao, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={divisao.nome}
                  onChange={(e) => atualizarDivisao(index, "nome", e.target.value)}
                  placeholder="Nome da pessoa"
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

      {erro && <p className="rounded-lg bg-vermelho-100 px-3 py-2 text-sm text-vermelho-700">{erro}</p>}

      <SubmitButtonManual enviando={enviando} />
    </form>
  );
}

function SubmitButtonManual({ enviando }: { enviando: boolean }) {
  return (
    <button
      type="submit"
      disabled={enviando}
      className="w-fit rounded-lg bg-verde-600 px-6 py-2 text-sm font-semibold text-white hover:bg-verde-700 disabled:opacity-60"
    >
      {enviando ? "Salvando..." : "Lançar gasto"}
    </button>
  );
}
