import { exigirUsuarioComConta } from "@/lib/data/context";
import { criarDividaFixa } from "@/app/actions/dividas-fixas";
import type { DividaFixaRow } from "@/types/database";
import { FormComErro } from "@/components/FormComErro";
import { SubmitButton } from "@/components/SubmitButton";
import { Campo } from "@/components/Campo";
import { DividaFixaLinha } from "@/components/DividaFixaLinha";
import { SeletorResponsavel } from "@/components/SeletorResponsavel";
import { mesAtual } from "@/lib/calc";

export default async function DividasFixasPage() {
  const { supabase, usuario } = await exigirUsuarioComConta();

  const { data } = await supabase
    .from("dividas_fixas")
    .select("*")
    .eq("conta_id", usuario.conta_id)
    .order("ativo", { ascending: false })
    .order("nome");

  const dividas = (data ?? []) as DividaFixaRow[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dívidas fixas</h1>
        <p className="text-sm text-foreground-muted">
          Aluguel, empréstimos e qualquer compromisso mensal fora do cartão.
        </p>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold">Nova dívida fixa</h2>
        <FormComErro action={criarDividaFixa} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo label="Nome" name="nome" placeholder="Ex.: Aluguel" required />
          <Campo label="Valor (R$)" name="valor" type="number" step="0.01" min="0.01" required />
          <Campo label="Dia de vencimento" name="dia_vencimento" type="number" min={1} max={31} required />
          <Campo label="Mês de início" name="mes_inicio" type="month" defaultValue={mesAtual()} required />
          <Campo label="Mês final (opcional, se tiver prazo)" name="mes_fim" type="month" />
          <SeletorResponsavel />
          <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
            <input type="checkbox" name="recorrente" defaultChecked className="h-4 w-4 accent-verde-600" />
            Recorrente (se desmarcar, vale só no mês de início)
          </label>
          <SubmitButton className="sm:col-span-2 sm:w-fit">Adicionar dívida fixa</SubmitButton>
        </FormComErro>
      </section>

      <section className="card p-6">
        <h2 className="font-semibold">Suas dívidas fixas</h2>
        {dividas.length === 0 ? (
          <p className="mt-3 text-sm text-foreground-muted">Nenhuma dívida fixa cadastrada ainda.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {dividas.map((divida) => (
              <DividaFixaLinha key={divida.id} divida={divida} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
