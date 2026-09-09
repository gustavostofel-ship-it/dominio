-- =========================================================================
-- Categoria da dívida fixa — pra dar pra família enxergar o que é
-- essencial (não dá pra cortar), o que é assinatura (dá pra cortar se
-- precisar apertar o orçamento) e o que é dívida com outra pessoa (não é
-- um compromisso fixo tipo aluguel, é dinheiro que você deve a alguém).
-- =========================================================================

alter table public.dividas_fixas
  add column if not exists categoria text not null default 'fixa'
    check (categoria in ('fixa', 'assinatura', 'divida_pessoa'));

create index if not exists dividas_fixas_categoria_idx on public.dividas_fixas (categoria);
