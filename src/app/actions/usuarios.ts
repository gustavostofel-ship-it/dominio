"use server";

import { revalidatePath } from "next/cache";
import { exigirUsuarioComConta } from "@/lib/data/context";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/server";
import type { ResultadoAcao } from "./auth";

/** Gestão de usuários da conta (7.10) — só o owner pode convidar/remover. */
export async function convidarUsuario(formData: FormData): Promise<ResultadoAcao> {
  const { usuario, supabase } = await exigirUsuarioComConta();

  if (usuario.papel !== "owner") {
    return { erro: "Só o dono da conta pode convidar novos usuários." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();

  if (!email || !nome) return { erro: "Informe nome e email." };

  const admin = await criarClienteSupabaseAdmin();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/redefinir-senha`,
    data: { nome },
  });

  if (error || !data.user) {
    return { erro: error?.message ?? "Falha ao convidar usuário." };
  }

  const { error: erroInsert } = await supabase.from("usuarios").insert({
    id: data.user.id,
    conta_id: usuario.conta_id,
    nome,
    email,
    papel: "membro",
  });

  if (erroInsert) return { erro: erroInsert.message };

  revalidatePath("/usuarios");
  return {};
}

export async function removerUsuario(formData: FormData): Promise<ResultadoAcao> {
  const { usuario, supabase } = await exigirUsuarioComConta();

  if (usuario.papel !== "owner") {
    return { erro: "Só o dono da conta pode remover usuários." };
  }

  const id = String(formData.get("id") ?? "");
  if (id === usuario.id) return { erro: "Você não pode remover a si mesmo." };

  const { error } = await supabase.from("usuarios").delete().eq("id", id).eq("conta_id", usuario.conta_id);

  if (error) return { erro: error.message };

  revalidatePath("/usuarios");
  return {};
}
