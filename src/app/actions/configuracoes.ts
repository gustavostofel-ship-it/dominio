"use server";

import { revalidatePath } from "next/cache";
import { exigirUsuarioComConta } from "@/lib/data/context";
import { reaisParaCentavos } from "@/lib/calc";
import type { ResultadoAcao } from "./auth";

export async function atualizarConfiguracoes(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, usuario } = await exigirUsuarioComConta();

  const renda = Number(formData.get("renda_mensal_esperada"));
  const limite = formData.get("limite_uso_cartao_mes");
  const faixaVerde = Number(formData.get("faixa_verde_pct"));
  const faixaAmarela = Number(formData.get("faixa_amarela_pct"));

  if (!Number.isFinite(renda) || renda < 0) return { erro: "Renda mensal esperada inválida." };
  if (!Number.isFinite(faixaVerde) || faixaVerde <= 0 || faixaVerde >= 100) {
    return { erro: "Faixa verde deve estar entre 1 e 99%." };
  }
  if (!Number.isFinite(faixaAmarela) || faixaAmarela <= faixaVerde || faixaAmarela >= 100) {
    return { erro: "Faixa amarela deve ser maior que a verde e menor que 100%." };
  }

  const { error } = await supabase.from("configuracoes").upsert(
    {
      conta_id: usuario.conta_id,
      renda_mensal_esperada_centavos: reaisParaCentavos(renda),
      limite_uso_cartao_mes_centavos: limite ? reaisParaCentavos(Number(limite)) : null,
      faixa_verde_pct: faixaVerde,
      faixa_amarela_pct: faixaAmarela,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "conta_id" }
  );

  if (error) return { erro: error.message };

  revalidatePath("/configuracoes");
  revalidatePath("/dashboard");
  revalidatePath("/projecao");
  return {};
}
