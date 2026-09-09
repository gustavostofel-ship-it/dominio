import { exigirUsuarioComConta } from "@/lib/data/context";
import { formatarBRL } from "@/lib/calc";
import type { CompraRow, DivisaoGastoRow } from "@/types/database";
import { DivisaoLinha } from "@/components/DivisaoLinha";

export default async function AReceberPage() {
  const { supabase, usuario } = await exigirUsuarioComConta();

  const { data } = await supabase
    .from("divisoes_gasto")
    .select("*")
    .eq("conta_id", usuario.conta_id)
    .order("mes_referencia");

  const divisoes = (data ?? []) as DivisaoGastoRow[];

  const idsCompras = [...new Set(divisoes.map((d) => d.compra_id))];
  const { data: comprasData } =
    idsCompras.length > 0 ? await supabase.from("compras").select("*").in("id", idsCompras) : { data: [] };
  const compras = new Map(((comprasData ?? []) as CompraRow[]).map((c) => [c.id, c]));

  const aCobrar = divisoes.filter((d) => d.status === "a_cobrar");
  const recebidas = divisoes.filter((d) => d.status === "recebido");
  const totalACobrar = aCobrar.reduce((acc, d) => acc + d.valor_centavos, 0);

  const porPessoa = new Map<string, DivisaoGastoRow[]>();
  for (const d of aCobrar) {
    if (!porPessoa.has(d.nome_da_pessoa)) porPessoa.set(d.nome_da_pessoa, []);
    porPessoa.get(d.nome_da_pessoa)!.push(d);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">A receber</h1>
        <p className="text-sm text-foreground-muted">
          Divisões de gastos que outras pessoas ainda te devem. Total a receber:{" "}
          <strong>{formatarBRL(totalACobrar)}</strong>
        </p>
      </div>

      {porPessoa.size === 0 ? (
        <p className="card p-6 text-sm text-foreground-muted">Nada a receber no momento.</p>
      ) : (
        Array.from(porPessoa.entries()).map(([pessoa, itens]) => (
          <section key={pessoa} className="card p-6">
            <h2 className="font-semibold">{pessoa}</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {itens.map((d) => (
                <DivisaoLinha key={d.id} divisao={d} descricaoCompra={compras.get(d.compra_id)?.descricao} />
              ))}
            </ul>
          </section>
        ))
      )}

      {recebidas.length > 0 && (
        <section className="card p-6">
          <h2 className="font-semibold text-foreground-muted">Já recebidas ({recebidas.length})</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {recebidas.map((d) => (
              <DivisaoLinha key={d.id} divisao={d} descricaoCompra={compras.get(d.compra_id)?.descricao} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
