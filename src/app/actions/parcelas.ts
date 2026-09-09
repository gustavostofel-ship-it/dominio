"use server";

import { revalidatePath } from "next/cache";
import { exigirUsuarioComConta } from "@/lib/data/context";
import type { ResultadoAcao } from "./auth";

function revalidarTudo() {
  revalidatePath("/dashboard");
  revalidatePath("/projecao");
  revalidatePath("/check-mes");
  revalidatePath("/historico");
}

/** Toggle rápido pago/pendente usado na tela de check do mês (7.4). */
export async function alternarStatusParcela(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, usuario } = await exigirUsuarioComConta();
  const id = String(formData.get("id") ?? "");
  const novoStatus = String(formData.get("novo_status") ?? "pendente");

  if (!["pendente", "pago_no_mes", "quitado_antecipado"].includes(novoStatus)) {
    return { erro: "Status inválido." };
  }

  const dataPagamentoReal = novoStatus === "pendente" ? null : new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .from("parcelas")
    .update({ status: novoStatus, data_pagamento_real: dataPagamentoReal })
    .eq("id", id)
    .eq("conta_id", usuario.conta_id);

  if (error) return { erro: error.message };

  revalidarTudo();
  return {};
}

/** Quitação antecipada (7.9): marca uma parcela futura como quitada antes do vencimento. */
export async function quitarParcelaAntecipadamente(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, usuario } = await exigirUsuarioComConta();
  const id = String(formData.get("id") ?? "");
  const dataPagamentoReal = String(formData.get("data_pagamento_real") ?? new Date().toISOString().slice(0, 10));

  const { error } = await supabase
    .from("parcelas")
    .update({ status: "quitado_antecipado", data_pagamento_real: dataPagamentoReal })
    .eq("id", id)
    .eq("conta_id", usuario.conta_id);

  if (error) return { erro: error.message };

  revalidarTudo();
  return {};
}
