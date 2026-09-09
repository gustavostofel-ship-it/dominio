import Link from "next/link";
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
          Escolha o cartão, o valor, o parcelamento e dê um nome para o gasto.
        </p>
      </div>

      {cartoes.length === 0 ? (
        <p className="card p-6 text-sm text-foreground-muted">
          Cadastre um cartão antes de lançar um gasto.{" "}
          <Link href="/cartoes" className="font-medium text-verde-700 hover:underline">
            Ir para Cartões →
          </Link>
        </p>
      ) : (
        <LancarGastoForm cartoes={cartoes} />
      )}
    </div>
  );
}
