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
          Cadastre aqui as dívidas que você já tem hoje, mesmo sem nome detalhado. Duas
          possibilidades: uma <strong>compra parcelada</strong> (tem fim definido — precisa de
          cartão) ou uma <strong>conta recorrente</strong> (sem fim definido, tipo assinatura,
          aluguel ou dívida com pessoa — não precisa de cartão). O Domínio já passa a contar isso
          na sua projeção. Depois disso, todo lançamento novo pede um nome completo.
        </p>
      </div>

      <OnboardingForm cartoes={cartoes} />

      <Link href="/dashboard" className="text-sm font-medium text-verde-700 hover:underline">
        Terminei, ir para o dashboard →
      </Link>
    </div>
  );
}
