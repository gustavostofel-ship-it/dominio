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
 * Encerra uma dívida fixa a partir de agora, sem apagar o histórico: define
 * mes_fim = mês atual, então este mês ainda conta normalmente (você ainda
 * deve/pagou esse último ciclo), mas a partir do mês que vem ela some
 * sozinha do dashboard, da fatura e da projeção — sem precisar arquivar
 * (o que a removeria também do mês atual).
 */
export async function encerrarDividaFixaAgora(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, usuario } = await exigirUsuarioComConta();
  const id = String(formData.get("id") ?? "");
  if (!id) return { erro: "Dívida inválida." };

  const { error } = await supabase
    .from("dividas_fixas")
    .update({
      mes_fim: mesRefParaData(mesAtual()),
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
