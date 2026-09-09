import { cache } from "react";
import { redirect } from "next/navigation";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import type { UsuarioRow } from "@/types/database";

export interface ContextoUsuario {
  supabase: Awaited<ReturnType<typeof criarClienteSupabaseServidor>>;
  authUserId: string;
  usuario: UsuarioRow;
}

/**
 * Carrega o usuário autenticado + seu perfil (usuarios) já vinculado à
 * conta. Redireciona para /login se não autenticado, e para /cadastro se
 * autenticado mas ainda sem conta (fluxo normal logo após o signup).
 */
export const exigirUsuarioComConta = cache(async function exigirUsuarioComConta(): Promise<ContextoUsuario> {
  const supabase = await criarClienteSupabaseServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: usuario, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<UsuarioRow>();

  if (error) {
    throw new Error(`Falha ao carregar perfil do usuário: ${error.message}`);
  }

  if (!usuario) {
    redirect("/cadastro/conta");
  }

  return { supabase, authUserId: user.id, usuario };
});
