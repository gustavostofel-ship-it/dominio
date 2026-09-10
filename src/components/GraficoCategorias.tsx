import { ROTULOS_CATEGORIA, CORES_GRAFICO_CATEGORIA, ordemCategorias } from "@/components/CategoriaGasto";
import { formatarBRL } from "@/lib/calc";
import type { CategoriaGasto } from "@/types/database";

/**
 * Barras horizontais mostrando quanto do gasto do mês está em cada
 * categoria — pra responder "onde estou gastando mais": lazer, assinatura,
 * fixa essencial, dívida com pessoa ou outros.
 */
export function GraficoCategorias({ totais }: { totais: Map<CategoriaGasto, number> }) {
  const totalGeral = Array.from(totais.values()).reduce((acc, v) => acc + v, 0);
  const linhas = ordemCategorias()
    .map((categoria) => ({ categoria, valor: totais.get(categoria) ?? 0 }))
    .filter((l) => l.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  if (linhas.length === 0) {
    return <p className="text-sm text-foreground-muted">Nada lançado neste mês ainda.</p>;
  }

  const maior = Math.max(...linhas.map((l) => l.valor));

  return (
    <div className="flex flex-col gap-3">
      {linhas.map(({ categoria, valor }) => {
        const pct = totalGeral > 0 ? (valor / totalGeral) * 100 : 0;
        const largura = maior > 0 ? (valor / maior) * 100 : 0;
        return (
          <div key={categoria}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium">{ROTULOS_CATEGORIA[categoria]}</span>
              <span className="text-foreground-muted">
                {formatarBRL(valor)} · {pct.toFixed(0)}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${largura}%`, backgroundColor: CORES_GRAFICO_CATEGORIA[categoria] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
