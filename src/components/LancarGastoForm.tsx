"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { criarCompra } from "@/app/actions/compras";
import { criarDividaFixa } from "@/app/actions/dividas-fixas";
import { Campo } from "@/components/Campo";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";
import { InputValorMonetario } from "@/components/InputValorMonetario";
import { SeletorResponsavel } from "@/components/SeletorResponsavel";
import { SeletorModoValor, type ModoValor } from "@/components/SeletorModoValor";
import { SeletorTipoGasto, type TipoGasto } from "@/components/SeletorTipoGasto";
import { CampoCartaoEVencimento } from "@/components/CampoCartaoEVencimento";
import { SeletorCategoria } from "@/components/CategoriaGasto";
import { mesAtual } from "@/lib/calc";
import type { CartaoRow } from "@/types/database";

interface Divisao {
  nome: string;
  valor: string;
}

export function LancarGastoForm({ cartoes }: { cartoes: CartaoRow[] }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoGasto>(cartoes.length > 0 ? "parcelada" : "assinatura");
  const [modoValor, setModoValor] = useState<ModoValor>("total");
  const [responsavel, setResponsavel] = useState("eu");
  const [divisoes, setDivisoes] = useState<Divisao[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const ehNos = responsavel === "eu";
  const semCartaoParaParcelada = tipo === "parcelada" && cartoes.length === 0;
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
    if (semCartaoParaParcelada) return;

    setErro(null);
    setEnviando(true);
    // atribuido_a já vem preenchido pelo campo hidden do SeletorResponsavel
    formData.set("divisoes_json", ehNos ? divisoesJson : "[]");

    if (tipo !== "parcelada") {
      formData.set("recorrente", "on");
      formData.set("categoria", tipo === "assinatura" ? "assinatura" : "divida_pessoa");
    }

    const resultado = tipo === "parcelada" ? await criarCompra(formData) : await criarDividaFixa(formData);
    setEnviando(false);
    if (resultado?.erro) {
      setErro(resultado.erro);
      return;
    }
    router.push(tipo === "parcelada" ? "/dashboard" : "/dividas-fixas");
  }

  return (
    <form action={aoSubmeter} className="card flex flex-col gap-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <SeletorTipoGasto tipo={tipo} onMudar={setTipo} />

        {/* Cada tipo remonta do zero (key={tipo}) — sem isso, o React reaproveita
            os <input> de mesma posição/tipo entre as trocas e o valor digitado
            num campo "vaza" pro campo equivalente do outro tipo (ex.: o mês
            default de um formulário aparecendo no campo errado do outro). */}
        <div key={tipo} className="contents">
          {tipo === "parcelada" ? (
            semCartaoParaParcelada ? (
              <p className="rounded-lg bg-surface-muted px-4 py-3 text-sm text-foreground-muted sm:col-span-2">
                Compra no cartão precisa de um cartão cadastrado primeiro.{" "}
                <Link href="/cartoes" className="font-medium text-verde-700 hover:underline">
                  Cadastrar cartão →
                </Link>
              </p>
            ) : (
              <>
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
                <SeletorModoValor modo={modoValor} onMudar={setModoValor} />
                <CampoValorMonetario
                  key={modoValor}
                  label={modoValor === "total" ? "Valor total" : "Valor de cada parcela"}
                  name="valor"
                  required
                />
                <Campo label="Número de parcelas" name="numero_parcelas" type="number" min={1} defaultValue={1} required />
                <Campo label="Mês de início" name="mes_inicio" type="month" defaultValue={mesAtual()} required />
                <Campo label="Descrição" name="descricao" placeholder="Ex.: Shopee (casamento)" required className="sm:col-span-2" />
                <SeletorCategoria />
              </>
            )
          ) : tipo === "assinatura" ? (
            <>
              <Campo label="Nome" name="nome" placeholder="Ex.: Netflix, Internet, um app novo" required className="sm:col-span-2" />
              <CampoValorMonetario label="Valor mensal" name="valor" required />
              <Campo label="Cobrando desde (mês)" name="mes_inicio" type="month" defaultValue={mesAtual()} required />
              <CampoCartaoEVencimento cartoes={cartoes} />
              <Campo label="Mês final (opcional, se já sabe quando termina)" name="mes_fim" type="month" />
            </>
          ) : (
            <>
              <Campo label="Nome da pessoa / do empréstimo" name="nome" placeholder="Ex.: Empréstimo da Ananda" required className="sm:col-span-2" />
              <CampoValorMonetario label="Valor da parcela mensal" name="valor" required />
              <Campo label="Dia de vencimento" name="dia_vencimento" type="number" min={1} max={31} required />
              <Campo label="Cobrando desde (mês)" name="mes_inicio" type="month" defaultValue={mesAtual()} required />
              <Campo label="Mês final (opcional — ex.: combinaram pagar em 5x)" name="mes_fim" type="month" />
            </>
          )}
        </div>
      </div>

      <SeletorResponsavel rotulo="De quem é esse gasto?" aoMudar={setResponsavel} />

      {ehNos && (
        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-semibold">Alguém vai te pagar uma parte? (opcional)</legend>
          <div className="mt-2 flex flex-col gap-3">
            {divisoes.map((divisao, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={divisao.nome}
                  onChange={(e) => atualizarDivisao(index, "nome", e.target.value)}
                  placeholder="Nome da pessoa (obrigatório)"
                  autoComplete="off"
                  required
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-verde-500 focus:ring-2 focus:ring-verde-100"
                />
                <InputValorMonetario
                  valorReais={divisao.valor}
                  onChange={(v) => atualizarDivisao(index, "valor", v)}
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

      {!semCartaoParaParcelada && <SubmitButtonManual enviando={enviando} tipo={tipo} />}
    </form>
  );
}

function SubmitButtonManual({ enviando, tipo }: { enviando: boolean; tipo: TipoGasto }) {
  const rotulo = tipo === "parcelada" ? "Lançar gasto" : tipo === "assinatura" ? "Cadastrar assinatura" : "Cadastrar dívida";
  return (
    <button
      type="submit"
      disabled={enviando}
      className="w-fit rounded-lg bg-verde-600 px-6 py-2 text-sm font-semibold text-white hover:bg-verde-700 disabled:opacity-60"
    >
      {enviando ? "Salvando..." : rotulo}
    </button>
  );
}
