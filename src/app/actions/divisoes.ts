"use server";

import { revalidatePath } from "next/cache";
import { exigirUsuarioComConta } from "@/lib/data/context";
import type { ResultadoAcao } from "./auth";

export async function marcarDivisaoRecebida(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, usuario } = await exigirUsuarioComConta();
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase
    .from("divisoes_gasto")
    .update({ status: "recebido" })
    .eq("id", id)
    .eq("conta_id", usuario.conta_id);

  if (error) return { erro: error.message };

  revalidatePath("/a-receber");
  return {};
}

export async function marcarDivisaoAReceber(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, usuario } = await exigirUsuarioComConta();
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase
    .from("divisoes_gasto")
    .update({ status: "a_cobrar" })
    .eq("id", id)
    .eq("conta_id", usuario.conta_id);

  if (error) return { erro: error.message };

  revalidatePath("/a-receber");
  return {};
}
