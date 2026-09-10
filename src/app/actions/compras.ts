"use server";

import { revalidatePath } from "next/cache";
import { exigirUsuarioComConta } from "@/lib/data/context";
import { gerarParcelas, reaisParaCentavos, mesAtual } from "@/lib/calc";
import type { ResultadoAcao } from "./auth";

interface DivisaoInput {
  nome: string;
  valor: number;
}

async function inserirCompraComParcelas(params: {
  cartaoId: string;
  descricao: string;
  valor: number;
  numeroParcelas: number;
  mesInicio: string;
  atribuidoA: string;
  modoValor: string;
  categoria: string;
  divisoes: DivisaoInput[];
}): Promise<ResultadoAcao> {
  const { supabase, usuario } = await exigirUsuarioComConta();
  const { cartaoId, descricao, valor, numeroParcelas, mesInicio, atribuidoA, modoValor, categoria, divisoes } = params;

  if (!cartaoId) return { erro: "Selecione um cartão." };
  if (!Number.isFinite(valor) || valor <= 0) return { erro: "Valor inválido." };
  if (!Number.isInteger(numeroParcelas) || numeroParcelas < 1) return { erro: "Número de parcelas inválido." };
  if (!mesInicio) return { erro: "Informe o mês de início." };
  if (!["fixa", "assinatura", "divida_pessoa", "lazer", "outros"].includes(categoria)) {
    return { erro: "Categoria inválida." };
  }

  // "parcela": o valor informado é de CADA parcela (ex.: "4x de R$ 50") — o
  // sistema multiplica em centavos (exato, sem risco de arredondamento) pra
  // achar o total. "total" (padrão): o valor já é o total, dividido pelas
  // parcelas na hora de gerar cada uma (ver gerarParcelas).
  const valorInformadoCentavos = reaisParaCentavos(valor);
  const valorTotalCentavos = modoValor === "parcela" ? valorInformadoCentavos * numeroParcelas : valorInformadoCentavos;

  const { data: compra, error: erroCompra } = await supabase
    .from("compras")
    .insert({
      conta_id: usuario.conta_id,
      cartao_id: cartaoId,
      descricao,
      valor_total_centavos: valorTotalCentavos,
      numero_parcelas: numeroParcelas,
      mes_inicio: `${mesInicio}-01`,
      atribuido_a: atribuidoA,
      categoria,
      criado_por: usuario.id,
    })
    .select("id")
    .single();

  if (erroCompra || !compra) {
    return { erro: erroCompra?.message ?? "Falha ao criar compra." };
  }

  // Regra de cálculo #1: geração determinística das parcelas, com o
  // arredondamento absorvido pela última parcela.
  const parcelas = gerarParcelas({ valorTotalCentavos, numeroParcelas, mesInicio });

  const { error: erroParcelas } = await supabase.from("parcelas").insert(
    parcelas.map((p) => ({
      conta_id: usuario.conta_id,
      compra_id: compra.id,
      numero_da_parcela: p.numeroDaParcela,
      mes_referencia: `${p.mesReferencia}-01`,
      valor_centavos: p.valorCentavos,
      status: "pendente" as const,
    }))
  );

  if (erroParcelas) {
    // limpa a compra órfã para não deixar dado inconsistente
    await supabase.from("compras").delete().eq("id", compra.id);
    return { erro: erroParcelas.message };
  }

  const divisoesValidas = divisoes.filter((d) => d.nome.trim() && Number.isFinite(d.valor) && d.valor > 0);
  if (divisoesValidas.length > 0) {
    const { error: erroDivisoes } = await supabase.from("divisoes_gasto").insert(
      divisoesValidas.map((d) => ({
        conta_id: usuario.conta_id,
        compra_id: compra.id,
        nome_da_pessoa: d.nome.trim(),
        valor_centavos: reaisParaCentavos(d.valor),
        status: "a_cobrar" as const,
        mes_referencia: `${mesInicio}-01`,
      }))
    );
    if (erroDivisoes) return { erro: erroDivisoes.message };
  }

  revalidarTudo();
  return {};
}

/** Fluxo completo de lançamento de gasto (7.3) — nome/descrição obrigatório. */
export async function criarCompra(formData: FormData): Promise<ResultadoAcao> {
  const descricao = String(formData.get("descricao") ?? "").trim();
  if (!descricao) return { erro: "A descrição do gasto é obrigatória." };

  const divisoesJson = String(formData.get("divisoes_json") ?? "[]");
  let divisoes: DivisaoInput[] = [];
  try {
    divisoes = JSON.parse(divisoesJson);
  } catch {
    divisoes = [];
  }

  return inserirCompraComParcelas({
    cartaoId: String(formData.get("cartao_id") ?? ""),
    descricao,
    valor: Number(formData.get("valor")),
    numeroParcelas: Number(formData.get("numero_parcelas") || 1),
    mesInicio: String(formData.get("mes_inicio") ?? mesAtual()),
    atribuidoA: String(formData.get("atribuido_a") ?? "eu").trim() || "eu",
    modoValor: String(formData.get("modo_valor") ?? "total"),
    categoria: String(formData.get("categoria") ?? "outros"),
    divisoes,
  });
}

/**
 * Onboarding rápido de migração (7.1) — permite cadastrar uma dívida já
 * existente na planilha só com valor + parcelas restantes + cartão, sem
 * nome detalhado. O sistema já passa a contabilizá-la corretamente desde
 * o primeiro dia.
 */
export async function criarCompraOnboarding(formData: FormData): Promise<ResultadoAcao> {
  const descricaoInformada = String(formData.get("descricao") ?? "").trim();

  const divisoesJson = String(formData.get("divisoes_json") ?? "[]");
  let divisoes: DivisaoInput[] = [];
  try {
    divisoes = JSON.parse(divisoesJson);
  } catch {
    divisoes = [];
  }

  return inserirCompraComParcelas({
    cartaoId: String(formData.get("cartao_id") ?? ""),
    descricao: descricaoInformada || "Dívida migrada da planilha",
    valor: Number(formData.get("valor")),
    numeroParcelas: Number(formData.get("numero_parcelas") || 1),
    mesInicio: String(formData.get("mes_inicio") ?? mesAtual()),
    atribuidoA: String(formData.get("atribuido_a") ?? "eu").trim() || "eu",
    modoValor: String(formData.get("modo_valor") ?? "total"),
    categoria: String(formData.get("categoria") ?? "outros"),
    divisoes,
  });
}

function revalidarTudo() {
  revalidatePath("/cartoes/[id]", "page");
  revalidatePath("/dashboard");
  revalidatePath("/projecao");
  revalidatePath("/check-mes");
  revalidatePath("/historico");
  revalidatePath("/a-receber");
  revalidatePath("/cartoes");
}

/**
 * Edita uma compra já lançada. Importante: as parcelas de uma compra são
 * geradas (materializadas) uma única vez na criação — mudar o valor, o
 * número de parcelas ou o mês de início na tabela `compras` diretamente
 * (ex.: editando pelo Table Editor do Supabase) NÃO recalcula as parcelas
 * já existentes, então a projeção continua com os valores antigos. Por
 * isso editar sempre precisa passar por aqui: apagamos as parcelas
 * antigas e geramos novas do zero — o que também significa que qualquer
 * parcela já marcada como paga/quitada volta para "pendente".
 */
export async function atualizarCompra(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, usuario } = await exigirUsuarioComConta();

  const compraId = String(formData.get("id") ?? "");
  const cartaoId = String(formData.get("cartao_id") ?? "");
  const descricao = String(formData.get("descricao") ?? "").trim();
  const valor = Number(formData.get("valor"));
  const numeroParcelas = Number(formData.get("numero_parcelas") || 1);
  const mesInicio = String(formData.get("mes_inicio") ?? "");
  const atribuidoA = String(formData.get("atribuido_a") ?? "eu").trim() || "eu";
  const modoValor = String(formData.get("modo_valor") ?? "total");
  const categoria = String(formData.get("categoria") ?? "outros");

  if (!compraId) return { erro: "Compra inválida." };
  if (!cartaoId) return { erro: "Selecione um cartão." };
  if (!descricao) return { erro: "A descrição do gasto é obrigatória." };
  if (!Number.isFinite(valor) || valor <= 0) return { erro: "Valor inválido." };
  if (!Number.isInteger(numeroParcelas) || numeroParcelas < 1) return { erro: "Número de parcelas inválido." };
  if (!mesInicio) return { erro: "Informe o mês de início." };
  if (!["fixa", "assinatura", "divida_pessoa", "lazer", "outros"].includes(categoria)) {
    return { erro: "Categoria inválida." };
  }

  const valorInformadoCentavos = reaisParaCentavos(valor);
  const valorTotalCentavos = modoValor === "parcela" ? valorInformadoCentavos * numeroParcelas : valorInformadoCentavos;

  const { error: erroUpdate } = await supabase
    .from("compras")
    .update({
      cartao_id: cartaoId,
      descricao,
      valor_total_centavos: valorTotalCentavos,
      numero_parcelas: numeroParcelas,
      mes_inicio: `${mesInicio}-01`,
      atribuido_a: atribuidoA,
      categoria,
      editado_por: usuario.id,
      editado_em: new Date().toISOString(),
    })
    .eq("id", compraId)
    .eq("conta_id", usuario.conta_id);

  if (erroUpdate) return { erro: erroUpdate.message };

  // Regenera as parcelas do zero a partir dos novos valores.
  const { error: erroApagar } = await supabase.from("parcelas").delete().eq("compra_id", compraId);
  if (erroApagar) return { erro: erroApagar.message };

  const parcelas = gerarParcelas({ valorTotalCentavos, numeroParcelas, mesInicio });
  const { error: erroParcelas } = await supabase.from("parcelas").insert(
    parcelas.map((p) => ({
      conta_id: usuario.conta_id,
      compra_id: compraId,
      numero_da_parcela: p.numeroDaParcela,
      mes_referencia: `${p.mesReferencia}-01`,
      valor_centavos: p.valorCentavos,
      status: "pendente" as const,
    }))
  );
  if (erroParcelas) return { erro: erroParcelas.message };

  revalidarTudo();
  return {};
}

/** Exclui uma compra e tudo o que depende dela (parcelas, divisões) em cascata. */
export async function excluirCompra(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, usuario } = await exigirUsuarioComConta();
  const compraId = String(formData.get("id") ?? "");
  if (!compraId) return { erro: "Compra inválida." };

  const { error } = await supabase.from("compras").delete().eq("id", compraId).eq("conta_id", usuario.conta_id);
  if (error) return { erro: error.message };

  revalidarTudo();
  return {};
}
