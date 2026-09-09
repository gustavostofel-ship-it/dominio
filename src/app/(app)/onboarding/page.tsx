import Link from "next/link";
import { exigirUsuarioComConta } from "@/lib/data/context";
import type { CartaoRow } from "@/types/database";
import { OnboardingForm } from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const { supabase, usuario } = await exigirUsuarioComConta();

  const { data } = await supabase
    .from("cartoes")
    .select("*")
    .eq("conta_id", usuario.conta_id)
    .eq("ativo", true)
    .order("nome");

  const cartoes = (data ?? []) as CartaoRow[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Migração rápida da sua planilha</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Cadastre aqui as dívidas que você já tem hoje, mesmo sem nome detalhado — só valor,
          parcelas restantes e cartão. O Domínio já passa a contar isso na sua projeção. Depois
          disso, todo lançamento novo pede um nome completo.
        </p>
      </div>

      {cartoes.length === 0 ? (
        <p className="card p-6 text-sm text-foreground-muted">
          Primeiro cadastre ao menos um cartão.{" "}
          <Link href="/cartoes" className="font-medium text-verde-700 hover:underline">
            Ir para Cartões →
          </Link>
        </p>
      ) : (
        <OnboardingForm cartoes={cartoes} />
      )}

      <Link href="/dashboard" className="text-sm font-medium text-verde-700 hover:underline">
        Terminei, ir para o dashboard →
      </Link>
    </div>
  );
}
