"use client";

import { useState } from "react";
import { useMemo } from "react";
import { DividaFixaLinha } from "@/components/DividaFixaLinha";
import { CategoriaPill, ROTULOS_CATEGORIA, ordemCategorias } from "@/components/CategoriaGasto";
import { formatarBRL } from "@/lib/calc";
import type { CartaoRow, CategoriaGasto, DividaFixaRow } from "@/types/database";

/**
 * Lista de dívidas fixas com filtro rápido por categoria — em vez de rolar
 * a página inteira pra achar "só as assinaturas" ou "só o que devo pra
 * alguém", um clique já filtra a lista pra mostrar só aquele grupo.
 */
export function PainelDividasFixas({ dividas, cartoes }: { dividas: DividaFixaRow[]; cartoes: CartaoRow[] }) {
  const [filtro, setFiltro] = useState<CategoriaGasto | "todas">("todas");
  const categorias = ordemCategorias();

  const dividasAtivas = useMemo(() => dividas.filter((d) => d.ativo), [dividas]);
  const totalPorCategoria = useMemo(() => {
    const totais = new Map<CategoriaGasto, number>();
    for (const categoria of categorias) {
      totais.set(
        categoria,
        dividasAtivas.filter((d) => d.categoria === categoria).reduce((acc, d) => acc + d.valor_centavos, 0)
      );
    }
    return totais;
  }, [dividasAtivas, categorias]);

  const contagemPorCategoria = useMemo(() => {
    const contagem = new Map<CategoriaGasto, number>();
    for (const categoria of categorias) {
      contagem.set(categoria, dividas.filter((d) => d.categoria === categoria).length);
    }
    return contagem;
  }, [dividas, categorias]);

  const categoriasComItem = categorias.filter((c) => (contagemPorCategoria.get(c) ?? 0) > 0);
  const dividasFiltradas = filtro === "todas" ? dividas : dividas.filter((d) => d.categoria === filtro);

  return (
    <div className="flex flex-col gap-6">
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
                <button
                  key={categoria}
                  type="button"
                  onClick={() => setFiltro(categoria)}
                  className="rounded-lg border border-border p-4 text-left transition-colors hover:border-verde-500 hover:bg-verde-50"
                >
                  <CategoriaPill categoria={categoria} />
                  <p className="mt-2 text-xl font-bold">{formatarBRL(totalPorCategoria.get(categoria) ?? 0)}</p>
                  <p className="text-xs text-foreground-muted">
                    {dividasAtivas.filter((d) => d.categoria === categoria).length} item(ns) por mês
                  </p>
                </button>
              ))}
          </div>
        </section>
      )}

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Suas dívidas fixas</h2>
          {categoriasComItem.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFiltro("todas")}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  filtro === "todas" ? "border-verde-500 bg-verde-100 text-verde-700" : "border-border text-foreground-muted"
                }`}
              >
                Todas ({dividas.length})
              </button>
              {categoriasComItem.map((categoria) => (
                <button
                  key={categoria}
                  type="button"
                  onClick={() => setFiltro(categoria)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    filtro === categoria
                      ? "border-verde-500 bg-verde-100 text-verde-700"
                      : "border-border text-foreground-muted"
                  }`}
                >
                  {ROTULOS_CATEGORIA[categoria]} ({contagemPorCategoria.get(categoria)})
                </button>
              ))}
            </div>
          )}
        </div>

        {dividas.length === 0 ? (
          <p className="mt-3 text-sm text-foreground-muted">Nenhuma dívida fixa cadastrada ainda.</p>
        ) : filtro === "todas" ? (
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
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {dividasFiltradas.map((divida) => (
              <DividaFixaLinha key={divida.id} divida={divida} cartoes={cartoes} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
