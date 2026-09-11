import Link from "next/link";
import { exigirUsuarioComConta } from "@/lib/data/context";
import { criarDividaFixa } from "@/app/actions/dividas-fixas";
import type { CartaoRow, DividaFixaRow } from "@/types/database";
import { FormComErro } from "@/components/FormComErro";
import { SubmitButton } from "@/components/SubmitButton";
import { Campo } from "@/components/Campo";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";
import { PainelDividasFixas } from "@/components/PainelDividasFixas";
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

  const { data: cartoesData } = await supabase
    .from("cartoes")
    .select("*")
    .eq("conta_id", usuario.conta_id)
    .eq("ativo", true)
    .order("nome");
  const cartoes = (cartoesData ?? []) as CartaoRow[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Assinaturas e dívidas</h1>
        <p className="text-sm text-foreground-muted">
          Consulte aqui tudo que se repete todo mês sem um fim definido: assinaturas, dívida com
          pessoa, dívida fixa e lazer recorrente. Assinatura ou dinheiro emprestado de alguém se
          cadastram em{" "}
          <Link href="/gastos/novo" className="font-medium text-verde-700 hover:underline">
            Lançar gasto
          </Link>
          . Compra parcelada de cartão (com fim definido) fica no{" "}
          <Link href="/historico" className="font-medium text-verde-700 hover:underline">
            Histórico
          </Link>
          .
        </p>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold">Nova dívida fixa essencial</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Só pra compromisso fixo de verdade — aluguel, luz, água, internet. Assinatura ou dinheiro
          emprestado de alguém, cadastre em Lançar gasto.
        </p>
        <FormComErro action={criarDividaFixa} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="categoria" value="fixa" />
          <Campo label="Nome" name="nome" placeholder="Ex.: Aluguel" required />
          <CampoValorMonetario label="Valor" name="valor" required />
          <Campo label="Dia de vencimento" name="dia_vencimento" type="number" min={1} max={31} required />
          <Campo label="Mês de início" name="mes_inicio" type="month" defaultValue={mesAtual()} required />
          <Campo label="Mês final (opcional, se tiver prazo)" name="mes_fim" type="month" />
          <label className="flex flex-col gap-1 text-sm font-medium">
            Cobrada em algum cartão? (opcional)
            <select
              name="cartao_id"
              defaultValue=""
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-verde-500 focus:ring-2 focus:ring-verde-100"
            >
              <option value="">Não — é paga direto (boleto, débito, etc.)</option>
              {cartoes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <SeletorResponsavel />
          <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
            <input type="checkbox" name="recorrente" defaultChecked className="h-4 w-4 accent-verde-600" />
            Recorrente (se desmarcar, vale só no mês de início)
          </label>
          <SubmitButton className="sm:col-span-2 sm:w-fit">Adicionar dívida fixa</SubmitButton>
        </FormComErro>
      </section>

      <PainelDividasFixas dividas={dividas} cartoes={cartoes} />
    </div>
  );
}
