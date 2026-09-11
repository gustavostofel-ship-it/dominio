import Link from "next/link";
import clsx from "clsx";
import { exigirUsuarioComConta } from "@/lib/data/context";
import { carregarProjecao, calcularGastosPorCategoria, calcularAReceberNoMes, statusDoResumo } from "@/lib/data/projecao";
import { mesAtual, somarMeses, formatarBRL } from "@/lib/calc";
import { StatusPill } from "@/components/StatusPill";
import { StatusGauge } from "@/components/StatusGauge";
import { CategoriaPill } from "@/components/CategoriaGasto";
import { GraficoCategorias } from "@/components/GraficoCategorias";

const NOMES_MES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function rotuloMes(mesRef: string): string {
  const [ano, mes] = mesRef.split("-").map(Number);
  return `${NOMES_MES[mes - 1]} de ${ano}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const ctx = await exigirUsuarioComConta();

  const mesInicioProjecao = mesAtual();
  const dados = await carregarProjecao(ctx, { mesInicio: mesInicioProjecao, quantidadeMeses: 2 });

  const mesSelecionado = mes === somarMeses(mesInicioProjecao, 1) ? mes : mesInicioProjecao;
  const resumo = dados.resumos.find((r) => r.mesReferencia === mesSelecionado) ?? dados.resumos[0];
  const status = statusDoResumo(resumo, dados.configuracoes);
  const renda = dados.configuracoes.renda_mensal_esperada_centavos;
  const percentualRenda = renda > 0 ? (resumo.totalDevidoCentavos / renda) * 100 : 100;

  const itensProprios = resumo.itens.filter((i) => i.atribuidoA === "eu");
  const itensTerceiros = resumo.itens.filter((i) => i.atribuidoA !== "eu");

  // Agrupa por cartão tanto parcelas de compra quanto dívidas fixas
  // cobradas no cartão (ex.: assinaturas) para exibir "valor da fatura" por
  // cartão. Dívidas fixas sem cartão vinculado ficam na seção separada.
  const gruposPorCartao = new Map<string, { cartaoId: string | null; nome: string; itens: typeof itensProprios }>();
  const dividasFixasProprias = itensProprios.filter((i) => {
    if (i.origem !== "divida_fixa") return false;
    const dividaFixaId = i.id.split("|")[0];
    return !dados.dividasFixasPorId.get(dividaFixaId)?.cartao_id;
  });

  for (const item of itensProprios) {
    let cartaoId: string | null = null;
    if (item.origem === "parcela") {
      cartaoId = dados.parcelaCartaoId.get(item.id) ?? null;
    } else {
      const dividaFixaId = item.id.split("|")[0];
      cartaoId = dados.dividasFixasPorId.get(dividaFixaId)?.cartao_id ?? null;
    }
    if (!cartaoId) continue;

    const cartao = dados.cartoesPorId.get(cartaoId);
    if (!gruposPorCartao.has(cartaoId)) {
      gruposPorCartao.set(cartaoId, { cartaoId, nome: cartao?.nome ?? "Cartão", itens: [] });
    }
    gruposPorCartao.get(cartaoId)!.itens.push(item);
  }

  const gastosPorCategoria = calcularGastosPorCategoria(dados, mesSelecionado);
  const aReceber = calcularAReceberNoMes(dados, mesSelecionado);
  const totalLiquidoCentavos = resumo.totalDevidoCentavos - aReceber.totalCentavos;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-foreground-muted">Visão geral de {rotuloMes(mesSelecionado)}.</p>
        </div>

        <div className="flex gap-2">
          <SeletorMes href="/dashboard" mesRef={mesInicioProjecao} ativo={mesSelecionado === mesInicioProjecao} label="Mês vigente" />
          <SeletorMes
            href="/dashboard"
            mesRef={somarMeses(mesInicioProjecao, 1)}
            ativo={mesSelecionado !== mesInicioProjecao}
            label="Próximo mês"
          />
        </div>
      </div>

      <div className="card grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-sm text-foreground-muted">Você deve neste mês</p>
            <StatusPill status={status} />
          </div>
          <p className="text-4xl font-bold tracking-tight text-foreground">
            {formatarBRL(resumo.totalDevidoCentavos)}
          </p>
          {aReceber.totalCentavos > 0 && (
            <p className="text-sm text-foreground-muted">
              Isso é a fatura cheia. Descontando o que vão te pagar de volta ({formatarBRL(aReceber.totalCentavos)}),
              sobra <strong className="text-foreground">{formatarBRL(totalLiquidoCentavos)}</strong> pra sair do seu bolso de fato.
            </p>
          )}
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-foreground-muted">Já pago no mês</p>
              <p className="font-semibold text-verde-700">{formatarBRL(resumo.totalPagoCentavos)}</p>
            </div>
            {aReceber.totalCentavos > 0 && (
              <div>
                <p className="text-foreground-muted">A receber de terceiros</p>
                <p className="font-semibold text-verde-700">{formatarBRL(aReceber.totalCentavos)}</p>
              </div>
            )}
            {renda > 0 && (
              <div>
                <p className="text-foreground-muted">Renda esperada</p>
                <p className="font-semibold">{formatarBRL(renda)}</p>
              </div>
            )}
          </div>
        </div>
        <StatusGauge percentual={percentualRenda} status={status} rotulo="dívidas vs. renda esperada" />
      </div>

      <section className="card p-6">
        <h2 className="font-semibold">Onde seu dinheiro está indo</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Tudo que é seu neste mês (pago ou pendente), por categoria — pra saber se é hora de
          cortar alguma assinatura ou gasto de lazer.
        </p>
        <div className="mt-4">
          <GraficoCategorias totais={gastosPorCategoria} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-semibold">Faturas por cartão</h2>
          {gruposPorCartao.size === 0 ? (
            <p className="mt-3 text-sm text-foreground-muted">Nenhuma parcela de cartão neste mês.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {Array.from(gruposPorCartao.entries()).map(([chave, grupo]) => {
                const total = grupo.itens.reduce((acc, i) => acc + i.valorCentavos, 0);
                const pendentes = grupo.itens.filter((i) => i.status === "pendente").length;
                const aReceberDoCartao = aReceber.porCartao.get(grupo.cartaoId) ?? 0;
                const conteudo = (
                  <>
                    <div>
                      <p className="font-medium">{grupo.nome}</p>
                      <p className="text-xs text-foreground-muted">
                        {grupo.itens.length} item(ns) · {pendentes} pendente(s)
                        {aReceberDoCartao > 0 && <> · {formatarBRL(aReceberDoCartao)} a receber</>}
                      </p>
                    </div>
                    <p className="font-semibold">{formatarBRL(total)}</p>
                  </>
                );
                return grupo.cartaoId ? (
                  <Link
                    key={chave}
                    href={`/cartoes/${grupo.cartaoId}?mes=${mesSelecionado}`}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:border-verde-500 hover:bg-verde-50"
                  >
                    {conteudo}
                  </Link>
                ) : (
                  <div key={chave} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    {conteudo}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="card p-6">
          <h2 className="font-semibold">Dívidas fixas</h2>
          {dividasFixasProprias.length === 0 ? (
            <p className="mt-3 text-sm text-foreground-muted">Nenhuma dívida fixa neste mês.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {dividasFixasProprias.map((item) => {
                const dividaFixaId = item.id.split("|")[0];
                const categoria = dados.dividasFixasPorId.get(dividaFixaId)?.categoria;
                return (
                  <li key={item.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <span className="flex flex-wrap items-center gap-2">
                      {item.nome}
                      {categoria && <CategoriaPill categoria={categoria} />}
                    </span>
                    <div className="flex items-center gap-3">
                      <StatusItemBadge status={item.status} />
                      <span className="font-semibold">{formatarBRL(item.valorCentavos)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {itensTerceiros.length > 0 && (
        <section className="card border-dashed p-6">
          <h2 className="font-semibold text-foreground-muted">Dívidas de terceiros — não contam no seu total</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {itensTerceiros.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-lg bg-surface-muted px-4 py-3 text-sm">
                <span>
                  {item.nome} <span className="text-foreground-muted">— de {item.atribuidoA}</span>
                </span>
                <span className="font-medium">{formatarBRL(item.valorCentavos)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link href="/check-mes" className="text-sm font-medium text-verde-700 hover:underline">
        Ver check completo do mês →
      </Link>
    </div>
  );
}

function SeletorMes({ href, mesRef, ativo, label }: { href: string; mesRef: string; ativo: boolean; label: string }) {
  return (
    <Link
      href={`${href}?mes=${mesRef}`}
      className={clsx(
        "rounded-lg px-4 py-2 text-sm font-semibold",
        ativo ? "bg-verde-600 text-white" : "border border-border text-foreground-muted hover:bg-surface-muted"
      )}
    >
      {label}
    </Link>
  );
}

function StatusItemBadge({ status }: { status: string }) {
  if (status === "pendente") return <span className="status-pill status-pill--amarelo">Pendente</span>;
  if (status === "pago_no_mes") return <span className="status-pill status-pill--verde">Pago</span>;
  return <span className="status-pill status-pill--verde">Quitado antecipado</span>;
}
