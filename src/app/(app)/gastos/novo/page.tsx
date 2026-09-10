import { exigirUsuarioComConta } from "@/lib/data/context";
import type { CartaoRow } from "@/types/database";
import { LancarGastoForm } from "@/components/LancarGastoForm";

export default async function NovoGastoPage() {
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
        <h1 className="text-2xl font-bold">Lançar novo gasto</h1>
        <p className="text-sm text-foreground-muted">
          Uma compra no cartão (tem fim definido) ou uma assinatura/dívida fixa (sem fim definido,
          até você cancelar) — escolha o tipo abaixo.
        </p>
      </div>

      <LancarGastoForm cartoes={cartoes} />
    </div>
  );
}
