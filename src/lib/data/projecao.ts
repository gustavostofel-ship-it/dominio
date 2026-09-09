import {
  calcularResumoPorMes,
  calcularStatusFinanceiro,
  gerarInstanciasDividasFixas,
  gerarSequenciaDeMeses,
  mesAtual,
  type DividaFixaDef,
  type ItemProjecao,
  type MesRef,
  type OverrideStatusDividaFixa,
  type ResumoMes,
  type StatusFinanceiro,
} from "@/lib/calc";
import type { ContextoUsuario } from "./context";
import type {
  CartaoRow,
  ConfiguracoesRow,
  DividaFixaRow,
  DividaFixaStatusRow,
  ParcelaRow,
} from "@/types/database";

export interface DadosProjecao {
  meses: MesRef[];
  resumos: ResumoMes[];
  configuracoes: ConfiguracoesRow;
  cartoesPorId: Map<string, CartaoRow>;
  dividasFixasPorId: Map<string, DividaFixaRow>;
  nomesParcelas: Map<string, string>; // parcela.id -> descrição da compra
  parcelaCartaoId: Map<string, string>; // parcela.id -> cartao_id
}

/**
 * Busca todos os dados brutos necessários (cartões, compras+parcelas,
 * dívidas fixas + overrides de status, configurações) e monta a projeção
 * de N meses a partir de mesInicio usando o motor de cálculo puro.
 */
export async function carregarProjecao(
  ctx: ContextoUsuario,
  opcoes: { mesInicio?: MesRef; quantidadeMeses?: number } = {}
): Promise<DadosProjecao> {
  const { supabase, usuario } = ctx;
  const mesInicio = opcoes.mesInicio ?? mesAtual();
  const quantidadeMeses = opcoes.quantidadeMeses ?? 12;
  const meses = gerarSequenciaDeMeses(mesInicio, quantidadeMeses);
  const mesFinal = meses[meses.length - 1];

  const [cartoesRes, comprasRes, parcelasRes, dividasRes, statusRes, configRes] = await Promise.all([
    supabase.from("cartoes").select("*").eq("conta_id", usuario.conta_id),
    supabase.from("compras").select("*").eq("conta_id", usuario.conta_id),
    supabase
      .from("parcelas")
      .select("*")
      .eq("conta_id", usuario.conta_id)
      .gte("mes_referencia", `${mesInicio}-01`)
      .lte("mes_referencia", `${mesFinal}-28`),
    supabase.from("dividas_fixas").select("*").eq("conta_id", usuario.conta_id).eq("ativo", true),
    supabase
      .from("dividas_fixas_status")
      .select("*")
      .eq("conta_id", usuario.conta_id)
      .gte("mes_referencia", `${mesInicio}-01`)
      .lte("mes_referencia", `${mesFinal}-28`),
    supabase.from("configuracoes").select("*").eq("conta_id", usuario.conta_id).maybeSingle(),
  ]);

  const cartoes = (cartoesRes.data ?? []) as CartaoRow[];
  const compras = comprasRes.data ?? [];
  const parcelas = (parcelasRes.data ?? []) as ParcelaRow[];
  const dividasFixas = (dividasRes.data ?? []) as DividaFixaRow[];
  const statusOverrides = (statusRes.data ?? []) as DividaFixaStatusRow[];
  const configuracoes = (configRes.data as ConfiguracoesRow | null) ?? {
    conta_id: usuario.conta_id,
    renda_mensal_esperada_centavos: 0,
    limite_uso_cartao_mes_centavos: null,
    faixa_verde_pct: 60,
    faixa_amarela_pct: 90,
    atualizado_em: new Date().toISOString(),
  };

  const comprasPorId = new Map(compras.map((c) => [c.id, c]));
  const cartoesPorId = new Map(cartoes.map((c) => [c.id, c]));
  const dividasFixasPorId = new Map(dividasFixas.map((d) => [d.id, d]));
  const nomesParcelas = new Map<string, string>();
  const parcelaCartaoId = new Map<string, string>();

  const itensParcelas: ItemProjecao[] = parcelas.map((p) => {
    const compra = comprasPorId.get(p.compra_id);
    nomesParcelas.set(p.id, compra?.descricao ?? "(compra removida)");
    if (compra) parcelaCartaoId.set(p.id, compra.cartao_id);
    return {
      origem: "parcela",
      id: p.id,
      nome: compra ? `${compra.descricao} (${p.numero_da_parcela}/${compra.numero_parcelas})` : "(compra removida)",
      mesReferencia: p.mes_referencia.slice(0, 7),
      valorCentavos: p.valor_centavos,
      status: p.status,
      atribuidoA: compra?.atribuido_a ?? "eu",
    };
  });

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

  const instancias = gerarInstanciasDividasFixas(dividasDef, overrides, meses);

  const itensDividasFixas: ItemProjecao[] = instancias.map((inst) => {
    const divida = dividasFixasPorId.get(inst.dividaFixaId);
    return {
      origem: "divida_fixa",
      id: `${inst.dividaFixaId}|${inst.mesReferencia}`,
      nome: divida?.nome ?? "(dívida removida)",
      mesReferencia: inst.mesReferencia,
      valorCentavos: inst.valorCentavos,
      status: inst.status,
      atribuidoA: inst.atribuidoA,
    };
  });

  const resumos = calcularResumoPorMes([...itensParcelas, ...itensDividasFixas], meses);

  return { meses, resumos, configuracoes, cartoesPorId, dividasFixasPorId, nomesParcelas, parcelaCartaoId };
}

export function statusDoResumo(resumo: ResumoMes, config: ConfiguracoesRow): StatusFinanceiro {
  return calcularStatusFinanceiro({
    dividasPendentesCentavos: resumo.totalDevidoCentavos,
    rendaMensalEsperadaCentavos: config.renda_mensal_esperada_centavos,
    faixaVerdePct: config.faixa_verde_pct,
    faixaAmarelaPct: config.faixa_amarela_pct,
  });
}
