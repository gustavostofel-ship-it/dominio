import { exigirUsuarioComConta } from "@/lib/data/context";
import { criarCartao } from "@/app/actions/cartoes";
import type { CartaoRow as CartaoRowType } from "@/types/database";
import { FormComErro } from "@/components/FormComErro";
import { SubmitButton } from "@/components/SubmitButton";
import { Campo } from "@/components/Campo";
import { CartaoLinha } from "@/components/CartaoLinha";

export default async function CartoesPage() {
  const { supabase, usuario } = await exigirUsuarioComConta();

  const { data } = await supabase
    .from("cartoes")
    .select("*")
    .eq("conta_id", usuario.conta_id)
    .order("ativo", { ascending: false })
    .order("nome");

  const cartoes = (data ?? []) as CartaoRowType[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Cartões</h1>
        <p className="text-sm text-foreground-muted">Cadastre seus cartões de crédito com dia de fechamento e vencimento.</p>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold">Novo cartão</h2>
        <FormComErro action={criarCartao} className="mt-4 grid gap-4 sm:grid-cols-3">
          <Campo label="Nome" name="nome" placeholder="Ex.: Nubank" required />
          <Campo label="Dia de fechamento" name="dia_fechamento" type="number" min={1} max={31} required />
          <Campo label="Dia de vencimento" name="dia_vencimento" type="number" min={1} max={31} required />
          <SubmitButton className="sm:col-span-3 sm:w-fit">Adicionar cartão</SubmitButton>
        </FormComErro>
      </section>

      <section className="card p-6">
        <h2 className="font-semibold">Seus cartões</h2>
        {cartoes.length === 0 ? (
          <p className="mt-3 text-sm text-foreground-muted">Nenhum cartão cadastrado ainda.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {cartoes.map((cartao) => (
              <CartaoLinha key={cartao.id} cartao={cartao} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
