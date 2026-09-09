-- =========================================================================
-- Dívidas fixas cobradas no cartão (ex.: assinaturas, internet)
--
-- Uma dívida fixa recorrente (aluguel, empréstimo) não tem "N parcelas" —
-- ela se repete indefinidamente. Isso é exatamente o caso de assinaturas
-- (Netflix, internet) que são cobradas todo mês NO CARTÃO, mas nunca
-- "acabam" como uma compra parcelada acabaria. Antes não dava pra ligar
-- uma dívida fixa a um cartão; agora dá (campo opcional).
-- =========================================================================

alter table public.dividas_fixas
  add column if not exists cartao_id uuid references public.cartoes (id) on delete set null;

create index if not exists dividas_fixas_cartao_id_idx on public.dividas_fixas (cartao_id);
