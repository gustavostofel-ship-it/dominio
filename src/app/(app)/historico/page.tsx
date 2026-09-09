import { exigirUsuarioComConta } from "@/lib/data/context";
import { CompraCard } from "@/components/CompraCard";
import type { CartaoRow, CompraRow, ParcelaRow, UsuarioRow } from "@/types/database";

interface FiltrosHistorico {
  q?: string;
  atribuido?: "todos" | "eu" | "terceiros";
  status?: "todos" | "pendente" | "pago";
}

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<FiltrosHistorico>;
}) {
  const filtros = await searchParams;
  const { supabase, usuario } = await exigirUsuarioComConta();

  let query = supabase
    .from("compras")
    .select("*")
    .eq("conta_id", usuario.conta_id)
    .order("criado_em", { ascending: false });

  if (filtros.q) query = query.ilike("descricao", `%${filtros.q}%`);
  if (filtros.atribuido === "eu") query = query.eq("atribuido_a", "eu");
  if (filtros.atribuido === "terceiros") query = query.neq("atribuido_a", "eu");

  const { data: comprasData } = await query;
  const compras = (comprasData ?? []) as CompraRow[];

  const idsCompras = compras.map((c) => c.id);
  const { data: parcelasData } =
    idsCompras.length > 0
      ? await supabase.from("parcelas").select("*").in("compra_id", idsCompras)
      : { data: [] };
  const parcelas = (parcelasData ?? []) as ParcelaRow[];

  const { data: usuariosData } = await supabase.from("usuarios").select("*").eq("conta_id", usuario.conta_id);
  const usuarios = new Map(((usuariosData ?? []) as UsuarioRow[]).map((u) => [u.id, u.nome]));

  const { data: cartoesData } = await supabase
    .from("cartoes")
    .select("*")
    .eq("conta_id", usuario.conta_id)
    .order("nome");
  const cartoes = (cartoesData ?? []) as CartaoRow[];

  const parcelasPorCompra = new Map<string, ParcelaRow[]>();
  for (const p of parcelas) {
    if (!parcelasPorCompra.has(p.compra_id)) parcelasPorCompra.set(p.compra_id, []);
    parcelasPorCompra.get(p.compra_id)!.push(p);
  }

  const comprasFiltradas = compras.filter((compra) => {
    if (filtros.status === "todos" || !filtros.status) return true;
    const ps = parcelasPorCompra.get(compra.id) ?? [];
    if (filtros.status === "pendente") return ps.some((p) => p.status === "pendente");
    if (filtros.status === "pago") return ps.length > 0 && ps.every((p) => p.status !== "pendente");
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Histórico completo</h1>
        <p className="text-sm text-foreground-muted">Todas as compras já lançadas, para você nunca perder o rastro.</p>
      </div>

      <form className="card flex flex-wrap gap-3 p-6" method="get">
        <input
          type="text"
          name="q"
          defaultValue={filtros.q}
          placeholder="Buscar por nome..."
          className="min-w-[200px] flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-verde-500 focus:ring-2 focus:ring-verde-100"
        />
        <select name="atribuido" defaultValue={filtros.atribuido ?? "todos"} className="rounded-lg border border-border px-3 py-2 text-sm">
          <option value="todos">Todos</option>
          <option value="eu">Só meus</option>
          <option value="terceiros">Só de terceiros</option>
        </select>
        <select name="status" defaultValue={filtros.status ?? "todos"} className="rounded-lg border border-border px-3 py-2 text-sm">
          <option value="todos">Qualquer status</option>
          <option value="pendente">Com parcela pendente</option>
          <option value="pago">Totalmente pago</option>
        </select>
        <button type="submit" className="rounded-lg bg-verde-600 px-4 py-2 text-sm font-semibold text-white hover:bg-verde-700">
          Filtrar
        </button>
      </form>

      <section className="flex flex-col gap-3">
        {comprasFiltradas.length === 0 ? (
          <p className="card p-6 text-sm text-foreground-muted">Nenhuma compra encontrada com esses filtros.</p>
        ) : (
          comprasFiltradas.map((compra) => (
            <CompraCard
              key={compra.id}
              compra={compra}
              parcelas={parcelasPorCompra.get(compra.id) ?? []}
              cartoes={cartoes}
              nomeCriador={usuarios.get(compra.criado_por ?? "") ?? "—"}
            />
          ))
        )}
      </section>
    </div>
  );
}
