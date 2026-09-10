-- =========================================================================
-- Categoria unificada — agora tanto uma "compra" (gasto no cartão) quanto
-- uma "dívida fixa" têm categoria, usando o MESMO conjunto de valores, pra
-- dar pra somar os dois juntos num relatório único de "onde estou
-- gastando mais" (fixo essencial vs. assinatura vs. lazer vs. dívida com
-- pessoa vs. outros).
-- =========================================================================

-- dividas_fixas: adiciona 'lazer' e 'outros' às opções já existentes.
alter table public.dividas_fixas drop constraint if exists dividas_fixas_categoria_check;
alter table public.dividas_fixas
  add constraint dividas_fixas_categoria_check
    check (categoria in ('fixa', 'assinatura', 'divida_pessoa', 'lazer', 'outros'));

-- compras: mesmo conjunto de categorias, mas o padrão é 'outros' (a
-- maioria das compras no cartão é gasto do dia a dia, não uma das
-- categorias especiais).
alter table public.compras
  add column if not exists categoria text not null default 'outros'
    check (categoria in ('fixa', 'assinatura', 'divida_pessoa', 'lazer', 'outros'));

create index if not exists compras_categoria_idx on public.compras (categoria);
