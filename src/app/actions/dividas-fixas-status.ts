"use server";

import { revalidatePath } from "next/cache";
import { exigirUsuarioComConta } from "@/lib/data/context";
import type { ResultadoAcao } from "./auth";

function revalidarTudo() {
  revalidatePath("/cartoes/[id]", "page");
  revalidatePath("/dashboard");
  revalidatePath("/projecao");
  revalidatePath("/check-mes");
  revalidatePath("/historico");
}

/**
 * Cria ou atualiza a ocorrência mensal (dividas_fixas_status) de uma
 * dívida fixa recorrente — usado no toggle pago/pendente do check do mês e
 * na quitação antecipada.
 */
export async function definirStatusOcorrenciaDividaFixa(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, usuario } = await exigirUsuarioComConta();

  const dividaFixaId = String(formData.get("divida_fixa_id") ?? "");
  const mesReferencia = String(formData.get("mes_referencia") ?? ""); // "YYYY-MM"
  const novoStatus = String(formData.get("novo_status") ?? "pendente");
  const dataPagamentoReal =
    novoStatus === "pendente" ? null : String(formData.get("data_pagamento_real") ?? new Date().toISOString().slice(0, 10));

  if (!dividaFixaId || !mesReferencia) return { erro: "Dados inválidos." };
  if (!["pendente", "pago_no_mes", "quitado_antecipado"].includes(novoStatus)) {
    return { erro: "Status inválido." };
  }

  const { error } = await supabase.from("dividas_fixas_status").upsert(
    {
      conta_id: usuario.conta_id,
      divida_fixa_id: dividaFixaId,
      mes_referencia: `${mesReferencia}-01`,
      status: novoStatus,
      data_pagamento_real: dataPagamentoReal,
    },
    { onConflict: "divida_fixa_id,mes_referencia" }
  );

  if (error) return { erro: error.message };

  revalidarTudo();
  return {};
}
