"use server";

import { revalidatePath } from "next/cache";
import { exigirUsuarioComConta } from "@/lib/data/context";
import type { ResultadoAcao } from "./auth";

export async function criarCartao(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, usuario } = await exigirUsuarioComConta();

  const nome = String(formData.get("nome") ?? "").trim();
  const diaFechamento = Number(formData.get("dia_fechamento"));
  const diaVencimento = Number(formData.get("dia_vencimento"));

  if (!nome) return { erro: "Informe o nome do cartão." };
  if (!Number.isInteger(diaFechamento) || diaFechamento < 1 || diaFechamento > 31) {
    return { erro: "Dia de fechamento inválido." };
  }
  if (!Number.isInteger(diaVencimento) || diaVencimento < 1 || diaVencimento > 31) {
    return { erro: "Dia de vencimento inválido." };
  }

  const { error } = await supabase.from("cartoes").insert({
    conta_id: usuario.conta_id,
    nome,
    dia_fechamento: diaFechamento,
    dia_vencimento: diaVencimento,
    ativo: true,
    criado_por: usuario.id,
  });

  if (error) return { erro: error.message };

  revalidatePath("/cartoes");
  return {};
}

export async function atualizarCartao(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, usuario } = await exigirUsuarioComConta();

  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const diaFechamento = Number(formData.get("dia_fechamento"));
  const diaVencimento = Number(formData.get("dia_vencimento"));

  if (!id || !nome) return { erro: "Dados inválidos." };
  if (!Number.isInteger(diaFechamento) || diaFechamento < 1 || diaFechamento > 31) {
    return { erro: "Dia de fechamento inválido." };
  }
  if (!Number.isInteger(diaVencimento) || diaVencimento < 1 || diaVencimento > 31) {
    return { erro: "Dia de vencimento inválido." };
  }

  const { error } = await supabase
    .from("cartoes")
    .update({
      nome,
      dia_fechamento: diaFechamento,
      dia_vencimento: diaVencimento,
      editado_por: usuario.id,
      editado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("conta_id", usuario.conta_id);

  if (error) return { erro: error.message };

  revalidatePath("/cartoes");
  return {};
}

export async function arquivarCartao(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, usuario } = await exigirUsuarioComConta();
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase
    .from("cartoes")
    .update({ ativo: false, editado_por: usuario.id, editado_em: new Date().toISOString() })
    .eq("id", id)
    .eq("conta_id", usuario.conta_id);

  if (error) return { erro: error.message };

  revalidatePath("/cartoes");
  return {};
}
