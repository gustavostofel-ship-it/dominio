"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

export interface ResultadoAcao {
  erro?: string;
}

export async function entrar(formData: FormData): Promise<ResultadoAcao> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    return { erro: "Informe email e senha." };
  }

  const supabase = await criarClienteSupabaseServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    return { erro: "Email ou senha inválidos." };
  }

  redirect("/dashboard");
}

export async function cadastrar(formData: FormData): Promise<ResultadoAcao> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();

  if (!email || !senha || !nome) {
    return { erro: "Preencha nome, email e senha." };
  }
  if (senha.length < 8) {
    return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  }

  const supabase = await criarClienteSupabaseServidor();
  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome } },
  });

  if (error) {
    return { erro: error.message };
  }

  redirect("/cadastro/conta");
}

export async function criarContaEOwner(formData: FormData): Promise<ResultadoAcao> {
  const nomeConta = String(formData.get("nome_conta") ?? "").trim();
  const nomeUsuario = String(formData.get("nome_usuario") ?? "").trim();

  if (!nomeConta || !nomeUsuario) {
    return { erro: "Preencha o nome da conta e o seu nome." };
  }

  const supabase = await criarClienteSupabaseServidor();
  const { error } = await supabase.rpc("criar_conta_e_owner", {
    p_nome_conta: nomeConta,
    p_nome_usuario: nomeUsuario,
  });

  if (error) {
    return { erro: error.message };
  }

  redirect("/onboarding");
}

export async function sair() {
  const supabase = await criarClienteSupabaseServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function solicitarRecuperacaoSenha(formData: FormData): Promise<ResultadoAcao> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { erro: "Informe seu email." };

  const supabase = await criarClienteSupabaseServidor();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/redefinir-senha`,
  });

  if (error) return { erro: error.message };
  return {};
}

export async function redefinirSenha(formData: FormData): Promise<ResultadoAcao> {
  const senha = String(formData.get("senha") ?? "");
  if (senha.length < 8) {
    return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  }

  const supabase = await criarClienteSupabaseServidor();
  const { error } = await supabase.auth.updateUser({ password: senha });

  if (error) return { erro: error.message };
  redirect("/dashboard");
}
