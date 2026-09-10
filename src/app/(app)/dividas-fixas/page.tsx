import { exigirUsuarioComConta } from "@/lib/data/context";
import { criarDividaFixa } from "@/app/actions/dividas-fixas";
import type { CartaoRow, CategoriaGasto, DividaFixaRow } from "@/types/database";
import { FormComErro } from "@/components/FormComErro";
import { SubmitButton } from "@/components/SubmitButton";
import { Campo } from "@/components/Campo";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";
import { DividaFixaLinha } from "@/components/DividaFixaLinha";
import { SeletorResponsavel } from "@/components/SeletorResponsavel";
import { CategoriaPill, ROTULOS_CATEGORIA, SeletorCategoria, ordemCategorias } from "@/components/CategoriaGasto";
import { formatarBRL, mesAtual } from "@/lib/calc";

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

  const dividasAtivas = dividas.filter((d) => d.ativo);
  const categorias: CategoriaGasto[] = ordemCategorias();
  const totalPorCategoria = new Map<CategoriaGasto, number>(
    categorias.map((c) => [c, dividasAtivas.filter((d) => d.categoria === c).reduce((acc, d) => acc + d.valor_centavos, 0)])
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dívidas fixas</h1>
        <p className="text-sm text-foreground-muted">
          Aluguel, empréstimos e qualquer compromisso recorrente — inclusive assinaturas cobradas
          no cartão (Netflix, internet), se você marcar o cartão.
        </p>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold">Nova dívida fixa</h2>
        <FormComErro action={criarDividaFixa} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo label="Nome" name="nome" placeholder="Ex.: Aluguel ou Netflix" required />
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
          <SeletorCategoria defaultValue="fixa" />
          <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
            <input type="checkbox" name="recorrente" defaultChecked className="h-4 w-4 accent-verde-600" />
            Recorrente (se desmarcar, vale só no mês de início)
          </label>
          <SubmitButton className="sm:col-span-2 sm:w-fit">Adicionar dívida fixa</SubmitButton>
        </FormComErro>
      </section>

      {dividasAtivas.length > 0 && (
        <section className="card p-6">
          <h2 className="font-semibold">Resumo por categoria</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Pra saber, se precisar apertar o orçamento, o que dá pra cortar (assinatura) e o que
            não dá (fixa essencial) — e separar o que é dívida com uma pessoa.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categorias
              .filter((categoria) => dividasAtivas.some((d) => d.categoria === categoria))
              .map((categoria) => (
                <div key={categoria} className="rounded-lg border border-border p-4">
                  <CategoriaPill categoria={categoria} />
                  <p className="mt-2 text-xl font-bold">{formatarBRL(totalPorCategoria.get(categoria) ?? 0)}</p>
                  <p className="text-xs text-foreground-muted">
                    {dividasAtivas.filter((d) => d.categoria === categoria).length} item(ns) por mês
                  </p>
                </div>
              ))}
          </div>
        </section>
      )}

      <section className="card p-6">
        <h2 className="font-semibold">Suas dívidas fixas</h2>
        {dividas.length === 0 ? (
          <p className="mt-3 text-sm text-foreground-muted">Nenhuma dívida fixa cadastrada ainda.</p>
        ) : (
          categorias.map((categoria) => {
            const doGrupo = dividas.filter((d) => d.categoria === categoria);
            if (doGrupo.length === 0) return null;
            return (
              <div key={categoria} className="mt-4 first:mt-0">
                <h3 className="text-sm font-semibold text-foreground-muted">{ROTULOS_CATEGORIA[categoria]}</h3>
                <ul className="mt-2 flex flex-col gap-2">
                  {doGrupo.map((divida) => (
                    <DividaFixaLinha key={divida.id} divida={divida} cartoes={cartoes} />
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
