"use server";

import { revalidatePath } from "next/cache";
import { exigirUsuarioComConta } from "@/lib/data/context";
import { mesAtual, reaisParaCentavos } from "@/lib/calc";
import type { ResultadoAcao } from "./auth";

function mesRefParaData(mesRef: string): string {
  return `${mesRef}-01`;
}

export async function criarDividaFixa(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, usuario } = await exigirUsuarioComConta();

  const nome = String(formData.get("nome") ?? "").trim();
  const valor = Number(formData.get("valor"));
  const diaVencimento = Number(formData.get("dia_vencimento"));
  const recorrente = formData.get("recorrente") === "on";
  const mesInicio = String(formData.get("mes_inicio") ?? "");
  const mesFim = String(formData.get("mes_fim") ?? "").trim();
  const atribuidoA = String(formData.get("atribuido_a") ?? "eu").trim() || "eu";
  const cartaoId = String(formData.get("cartao_id") ?? "").trim() || null;
  const categoria = String(formData.get("categoria") ?? "fixa");

  if (!nome) return { erro: "Informe o nome da dívida." };
  if (!["fixa", "assinatura", "divida_pessoa", "lazer", "outros"].includes(categoria)) return { erro: "Categoria inválida." };
  if (!Number.isFinite(valor) || valor <= 0) return { erro: "Valor inválido." };
  if (!Number.isInteger(diaVencimento) || diaVencimento < 1 || diaVencimento > 31) {
    return { erro: "Dia de vencimento inválido." };
  }
  if (!mesInicio) return { erro: "Informe o mês de início." };

  const { error } = await supabase.from("dividas_fixas").insert({
    conta_id: usuario.conta_id,
    nome,
    valor_centavos: reaisParaCentavos(valor),
    dia_vencimento: diaVencimento,
    recorrente,
    mes_inicio: mesRefParaData(mesInicio),
    mes_fim: mesFim ? mesRefParaData(mesFim) : null,
    atribuido_a: atribuidoA,
    cartao_id: cartaoId,
    categoria,
    ativo: true,
    criado_por: usuario.id,
  });

  if (error) return { erro: error.message };

  revalidatePath("/dividas-fixas");
  revalidatePath("/dashboard");
  revalidatePath("/projecao");
  revalidatePath("/cartoes/[id]", "page");
  return {};
}

export async function atualizarDividaFixa(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, usuario } = await exigirUsuarioComConta();

  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const valor = Number(formData.get("valor"));
  const diaVencimento = Number(formData.get("dia_vencimento"));
  const recorrente = formData.get("recorrente") === "on";
  const mesFim = String(formData.get("mes_fim") ?? "").trim();
  const atribuidoA = String(formData.get("atribuido_a") ?? "eu").trim() || "eu";
  const cartaoId = String(formData.get("cartao_id") ?? "").trim() || null;
  const categoria = String(formData.get("categoria") ?? "fixa");

  if (!id || !nome) return { erro: "Dados inválidos." };
  if (!["fixa", "assinatura", "divida_pessoa", "lazer", "outros"].includes(categoria)) return { erro: "Categoria inválida." };
  if (!Number.isFinite(valor) || valor <= 0) return { erro: "Valor inválido." };
  if (!Number.isInteger(diaVencimento) || diaVencimento < 1 || diaVencimento > 31) {
    return { erro: "Dia de vencimento inválido." };
  }

  const { error } = await supabase
    .from("dividas_fixas")
    .update({
      nome,
      valor_centavos: reaisParaCentavos(valor),
      dia_vencimento: diaVencimento,
      recorrente,
      mes_fim: mesFim ? mesRefParaData(mesFim) : null,
      atribuido_a: atribuidoA,
      cartao_id: cartaoId,
      categoria,
      editado_por: usuario.id,
      editado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("conta_id", usuario.conta_id);

  if (error) return { erro: error.message };

  revalidatePath("/dividas-fixas");
  revalidatePath("/dashboard");
  revalidatePath("/projecao");
  revalidatePath("/cartoes/[id]", "page");
  return {};
}

/**
 * Migração rápida (7.1) de uma conta recorrente já existente na planilha —
 * mesmo fluxo de criarDividaFixa, mas sem exigir nome (cai num nome
 * genérico) e sempre marcando como recorrente e sem mês final, já que o
 * ponto desse fluxo é justamente contas sem fim definido (assinatura,
 * conta de luz, aluguel, dívida com pessoa).
 */
export async function criarDividaFixaOnboarding(formData: FormData): Promise<ResultadoAcao> {
  const nomeInformado = String(formData.get("nome") ?? "").trim();
  if (!nomeInformado) {
    formData.set("nome", "Conta migrada da planilha");
  }
  formData.set("recorrente", "on");
  formData.set("mes_fim", "");
  return criarDividaFixa(formData);
}

/**
 * Encerra uma dívida fixa recorrente, sem apagar o histórico: define
 * mes_fim com o mês escolhido pelo usuário (não necessariamente o mês
 * atual) — os meses até mes_fim (inclusive) continuam contando
 * normalmente e só a partir do mês seguinte ela some sozinha do
 * dashboard, da fatura e da projeção. Diferente de arquivar (que some até
 * do mês atual).
 *
 * O mês certo pra escolher depende de como ela é cobrada: numa dívida com
 * pessoa combinada informalmente costuma ser o mês atual mesmo, mas numa
 * assinatura cobrada no cartão, se a fatura do ciclo atual já fechou antes
 * do cancelamento, a cobrança ainda cai na fatura do mês seguinte — nesse
 * caso o usuário deve escolher o mês seguinte, não o atual.
 */
export async function encerrarDividaFixa(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, usuario } = await exigirUsuarioComConta();
  const id = String(formData.get("id") ?? "");
  const mesFim = String(formData.get("mes_fim") ?? "").trim();

  if (!id) return { erro: "Dívida inválida." };
  if (!/^\d{4}-\d{2}$/.test(mesFim)) return { erro: "Escolha até qual mês essa dívida ainda deve contar." };
  if (mesFim < mesAtual()) return { erro: "Não dá pra encerrar num mês que já passou — use Editar." };

  const { error } = await supabase
    .from("dividas_fixas")
    .update({
      mes_fim: mesRefParaData(mesFim),
      editado_por: usuario.id,
      editado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("conta_id", usuario.conta_id);

  if (error) return { erro: error.message };

  revalidatePath("/dividas-fixas");
  revalidatePath("/dashboard");
  revalidatePath("/projecao");
  revalidatePath("/cartoes/[id]", "page");
  return {};
}

export async function arquivarDividaFixa(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, usuario } = await exigirUsuarioComConta();
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase
    .from("dividas_fixas")
    .update({ ativo: false, editado_por: usuario.id, editado_em: new Date().toISOString() })
    .eq("id", id)
    .eq("conta_id", usuario.conta_id);

  if (error) return { erro: error.message };

  revalidatePath("/dividas-fixas");
  revalidatePath("/dashboard");
  revalidatePath("/projecao");
  revalidatePath("/cartoes/[id]", "page");
  return {};
}
