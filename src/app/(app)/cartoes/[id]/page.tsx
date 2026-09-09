import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { exigirUsuarioComConta } from "@/lib/data/context";
import {
  formatarBRL,
  gerarInstanciasDividasFixas,
  mesAtual,
  somarMeses,
  type DividaFixaDef,
  type OverrideStatusDividaFixa,
} from "@/lib/calc";
import type { CartaoRow, CompraRow, DividaFixaRow, DividaFixaStatusRow, ParcelaRow } from "@/types/database";

const NOMES_MES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function rotuloMes(mesRef: string): string {
  const [ano, mes] = mesRef.split("-").map(Number);
  return `${NOMES_MES[mes - 1]} de ${ano}`;
}

function StatusPillItem({ status }: { status: string }) {
  return (
    <span className={clsx("status-pill", status === "pendente" ? "status-pill--amarelo" : "status-pill--verde")}>
      {status === "pendente" ? "Pendente" : status === "pago_no_mes" ? "Pago" : "Quitado antecipado"}
    </span>
  );
}

export default async function FaturaCartaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  const { id } = await params;
  const { mes } = await searchParams;
  const { supabase, usuario } = await exigirUsuarioComConta();

  const mesSelecionado = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : mesAtual();

  const { data: cartaoData } = await supabase
    .from("cartoes")
    .select("*")
    .eq("id", id)
    .eq("conta_id", usuario.conta_id)
    .maybeSingle();

  const cartao = cartaoData as CartaoRow | null;
  if (!cartao) notFound();

  const { data: comprasData } = await supabase
    .from("compras")
    .select("*")
    .eq("cartao_id", id)
    .eq("conta_id", usuario.conta_id);
  const compras = (comprasData ?? []) as CompraRow[];
  const comprasPorId = new Map(compras.map((c) => [c.id, c]));

  const idsCompras = compras.map((c) => c.id);
  const { data: parcelasData } =
    idsCompras.length > 0
      ? await supabase
          .from("parcelas")
          .select("*")
          .in("compra_id", idsCompras)
          .eq("mes_referencia", `${mesSelecionado}-01`)
      : { data: [] };
  const parcelas = (parcelasData ?? []) as ParcelaRow[];

  const itensCompra = parcelas
    .map((p) => ({ parcela: p, compra: comprasPorId.get(p.compra_id) }))
    .filter((i) => i.compra)
    .sort((a, b) => a.compra!.descricao.localeCompare(b.compra!.descricao));

  // Dívidas fixas cobradas nesse cartão (ex.: assinaturas) que se aplicam ao mês selecionado.
  const { data: dividasFixasData } = await supabase
    .from("dividas_fixas")
    .select("*")
    .eq("cartao_id", id)
    .eq("conta_id", usuario.conta_id)
    .eq("ativo", true);
  const dividasFixas = (dividasFixasData ?? []) as DividaFixaRow[];
  const dividasFixasPorId = new Map(dividasFixas.map((d) => [d.id, d]));

  const idsDividasFixas = dividasFixas.map((d) => d.id);
  const { data: statusData } =
    idsDividasFixas.length > 0
      ? await supabase
          .from("dividas_fixas_status")
          .select("*")
          .in("divida_fixa_id", idsDividasFixas)
          .eq("mes_referencia", `${mesSelecionado}-01`)
      : { data: [] };
  const statusOverrides = (statusData ?? []) as DividaFixaStatusRow[];

  const dividasDef: DividaFixaDef[] = dividasFixas.map((d) => ({
    id: d.id,
    valorCentavos: d.valor_centavos,
    recorrente: d.recorrente,
    mesInicio: d.mes_inicio.slice(0, 7),
    mesFim: d.mes_fim ? d.mes_fim.slice(0, 7) : null,
    atribuidoA: d.atribuido_a,
  }));
  const overrides: OverrideStatusDividaFixa[] = statusOverrides.map((o) => ({
    dividaFixaId: o.divida_fixa_id,
    mesReferencia: o.mes_referencia.slice(0, 7),
    status: o.status,
    dataPagamentoReal: o.data_pagamento_real,
  }));
  const itensDividaFixa = gerarInstanciasDividasFixas(dividasDef, overrides, [mesSelecionado]);

  const totalMes =
    itensCompra.reduce((acc, i) => acc + i.parcela.valor_centavos, 0) +
    itensDividaFixa.reduce((acc, i) => acc + i.valorCentavos, 0);
  const totalPendente =
    itensCompra.filter((i) => i.parcela.status === "pendente").reduce((acc, i) => acc + i.parcela.valor_centavos, 0) +
    itensDividaFixa.filter((i) => i.status === "pendente").reduce((acc, i) => acc + i.valorCentavos, 0);
  const totalItens = itensCompra.length + itensDividaFixa.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard" className="text-sm font-medium text-verde-700 hover:underline">
          ← Voltar ao dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Fatura {cartao.nome}</h1>
        <p className="text-sm text-foreground-muted">
          Fecha dia {cartao.dia_fechamento} · Vence dia {cartao.dia_vencimento}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 card p-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/cartoes/${id}?mes=${somarMeses(mesSelecionado, -1)}`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-muted"
          >
            ← Mês anterior
          </Link>
          <span className="px-2 text-sm font-semibold capitalize">{rotuloMes(mesSelecionado)}</span>
          <Link
            href={`/cartoes/${id}?mes=${somarMeses(mesSelecionado, 1)}`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-muted"
          >
            Próximo mês →
          </Link>
        </div>
        {mesSelecionado !== mesAtual() && (
          <Link href={`/cartoes/${id}`} className="text-sm font-medium text-verde-700 hover:underline">
            Ir para o mês vigente
          </Link>
        )}
      </div>

      <div className="card flex flex-wrap gap-8 p-6">
        <div>
          <p className="text-sm text-foreground-muted">Total da fatura</p>
          <p className="text-2xl font-bold">{formatarBRL(totalMes)}</p>
        </div>
        <div>
          <p className="text-sm text-foreground-muted">Ainda pendente</p>
          <p className="text-2xl font-bold text-vermelho-600">{formatarBRL(totalPendente)}</p>
        </div>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold">Nesta fatura ({totalItens})</h2>
        {totalItens === 0 ? (
          <p className="mt-3 text-sm text-foreground-muted">Nada deste cartão vence em {rotuloMes(mesSelecionado)}.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {itensCompra.map(({ parcela, compra }) => (
              <li
                key={parcela.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {compra!.descricao}
                    {compra!.atribuido_a !== "eu" && (
                      <span className="ml-2 status-pill status-pill--amarelo">de {compra!.atribuido_a}</span>
                    )}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    Parcela {parcela.numero_da_parcela}/{compra!.numero_parcelas}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPillItem status={parcela.status} />
                  <span className="font-semibold">{formatarBRL(parcela.valor_centavos)}</span>
                </div>
              </li>
            ))}
            {itensDividaFixa.map((inst) => {
              const divida = dividasFixasPorId.get(inst.dividaFixaId);
              return (
                <li
                  key={inst.dividaFixaId}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{divida?.nome ?? "(dívida removida)"}</p>
                    <p className="text-xs text-foreground-muted">Assinatura/dívida fixa recorrente</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPillItem status={inst.status} />
                    <span className="font-semibold">{formatarBRL(inst.valorCentavos)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
