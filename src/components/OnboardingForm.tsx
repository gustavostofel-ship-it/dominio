"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { criarCompraOnboarding } from "@/app/actions/compras";
import { criarDividaFixaOnboarding } from "@/app/actions/dividas-fixas";
import { Campo } from "@/components/Campo";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";
import { InputValorMonetario } from "@/components/InputValorMonetario";
import { SeletorResponsavel } from "@/components/SeletorResponsavel";
import { SeletorModoValor, type ModoValor } from "@/components/SeletorModoValor";
import { SeletorTipoMigracao, type TipoMigracao } from "@/components/SeletorTipoMigracao";
import { SeletorCategoria } from "@/components/CategoriaGasto";
import { mesAtual, formatarBRL, reaisParaCentavos } from "@/lib/calc";
import type { CartaoRow } from "@/types/database";

interface ItemLancado {
  tipo: TipoMigracao;
  nome: string;
  valor: string;
  detalhe: string;
}

interface Divisao {
  nome: string;
  valor: string;
}

export function OnboardingForm({ cartoes }: { cartoes: CartaoRow[] }) {
  const [tipo, setTipo] = useState<TipoMigracao>(cartoes.length > 0 ? "parcelada" : "recorrente");
  const [lancadas, setLancadas] = useState<ItemLancado[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [responsavel, setResponsavel] = useState("eu");
  const [modoValor, setModoValor] = useState<ModoValor>("total");
  const [divisoes, setDivisoes] = useState<Divisao[]>([]);
  // Muda a cada envio bem-sucedido só pra forçar o SeletorResponsavel a
  // remontar do zero (senão "Outro" + o nome digitado ficariam presos
  // depois de cadastrar a dívida seguinte).
  const [resetKey, setResetKey] = useState(0);

  const ehNos = responsavel === "eu";
  const semCartaoParaParcelada = tipo === "parcelada" && cartoes.length === 0;
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
    if (semCartaoParaParcelada) return;

    setErro(null);
    setEnviando(true);
    formData.set("divisoes_json", ehNos ? divisoesJson : "[]");

    const resultado =
      tipo === "parcelada" ? await criarCompraOnboarding(formData) : await criarDividaFixaOnboarding(formData);
    setEnviando(false);

    if (resultado?.erro) {
      setErro(resultado.erro);
      return;
    }

    if (tipo === "parcelada") {
      const cartaoId = String(formData.get("cartao_id"));
      const cartaoNome = cartoes.find((c) => c.id === cartaoId)?.nome ?? "";
      const parcelas = Number(formData.get("numero_parcelas") || 1);
      const valorInformado = Number(formData.get("valor"));
      const valorTotal = modoValor === "parcela" ? valorInformado * parcelas : valorInformado;

      setLancadas((atual) => [
        ...atual,
        { tipo, nome: cartaoNome, valor: formatarBRL(reaisParaCentavos(valorTotal)), detalhe: `${parcelas}x` },
      ]);
    } else {
      const nome = String(formData.get("nome") || "").trim() || "Conta migrada da planilha";
      const valor = Number(formData.get("valor"));

      setLancadas((atual) => [
        ...atual,
        { tipo, nome, valor: formatarBRL(reaisParaCentavos(valor)), detalhe: "todo mês" },
      ]);
    }

    setDivisoes([]);
    setResponsavel("eu");
    setResetKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={aoSubmeter} className="card grid gap-4 p-6 sm:grid-cols-2">
        <SeletorTipoMigracao tipo={tipo} onMudar={setTipo} />

        {tipo === "parcelada" ? (
          semCartaoParaParcelada ? (
            <p className="rounded-lg bg-surface-muted px-4 py-3 text-sm text-foreground-muted sm:col-span-2">
              Compra parcelada precisa de um cartão cadastrado primeiro.{" "}
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
                label={modoValor === "total" ? "Valor total restante" : "Valor de cada parcela"}
                name="valor"
                required
              />
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
            </>
          )
        ) : (
          <>
            <Campo
              label="Nome (opcional)"
              name="nome"
              placeholder='Ex.: Netflix, Internet, Aluguel — em branco vira "Conta migrada da planilha"'
              className="sm:col-span-2"
            />
            <CampoValorMonetario label="Valor mensal" name="valor" required />
            <Campo label="Dia de vencimento" name="dia_vencimento" type="number" min={1} max={31} required />
            <Campo label="Cobrando desde (mês)" name="mes_inicio" type="month" defaultValue={mesAtual()} required />
            {cartoes.length > 0 && (
              <label className="flex flex-col gap-1 text-sm font-medium">
                Cobrada em algum cartão? (opcional)
                <select
                  name="cartao_id"
                  defaultValue=""
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
            )}
          </>
        )}

        <SeletorCategoria />

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

        {erro && (
          <p className="rounded-lg bg-vermelho-100 px-3 py-2 text-sm text-vermelho-700 sm:col-span-2">{erro}</p>
        )}

        {!semCartaoParaParcelada && (
          <button
            type="submit"
            disabled={enviando}
            className="w-fit rounded-lg bg-verde-600 px-6 py-2 text-sm font-semibold text-white hover:bg-verde-700 disabled:opacity-60 sm:col-span-2"
          >
            {enviando ? "Salvando..." : "Adicionar e continuar"}
          </button>
        )}
      </form>

      {lancadas.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold">Já cadastradas nesta sessão ({lancadas.length})</h2>
          <ul className="mt-3 flex flex-col gap-1 text-sm text-foreground-muted">
            {lancadas.map((l, i) => (
              <li key={i}>
                {l.tipo === "parcelada" ? (
                  <>
                    {l.nome} — {l.valor} em {l.detalhe}
                  </>
                ) : (
                  <>
                    {l.nome} — {l.valor} {l.detalhe} (recorrente)
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
