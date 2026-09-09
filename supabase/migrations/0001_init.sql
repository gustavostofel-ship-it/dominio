-- =========================================================================
-- DOMÍNIO — schema inicial (Fase 1)
-- Multi-tenant por conta_id, com Row Level Security em todas as tabelas.
-- Todo valor monetário é armazenado em CENTAVOS (bigint), nunca em float.
-- =========================================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. contas (tenant)
-- -------------------------------------------------------------------------
create table if not exists public.contas (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  criado_em   timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- 2. usuarios (perfil de cada auth.users, vinculado a uma conta)
-- -------------------------------------------------------------------------
create table if not exists public.usuarios (
  id          uuid primary key references auth.users (id) on delete cascade,
  conta_id    uuid not null references public.contas (id) on delete cascade,
  nome        text not null,
  email       text not null,
  papel       text not null default 'membro' check (papel in ('owner', 'membro')),
  criado_em   timestamptz not null default now()
);

create index if not exists usuarios_conta_id_idx on public.usuarios (conta_id);

-- Função auxiliar: conta_id do usuário autenticado.
-- security definer + dono da tabela (postgres) => não recai em recursão de RLS.
create or replace function public.current_conta_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select conta_id from public.usuarios where id = auth.uid()
$$;

create or replace function public.current_papel()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select papel from public.usuarios where id = auth.uid()
$$;

-- -------------------------------------------------------------------------
-- 3. cartoes
-- -------------------------------------------------------------------------
create table if not exists public.cartoes (
  id              uuid primary key default gen_random_uuid(),
  conta_id        uuid not null references public.contas (id) on delete cascade,
  nome            text not null,
  dia_fechamento  smallint not null check (dia_fechamento between 1 and 31),
  dia_vencimento  smallint not null check (dia_vencimento between 1 and 31),
  ativo           boolean not null default true,
  criado_por      uuid references public.usuarios (id),
  criado_em       timestamptz not null default now(),
  editado_por     uuid references public.usuarios (id),
  editado_em      timestamptz
);

create index if not exists cartoes_conta_id_idx on public.cartoes (conta_id);

-- -------------------------------------------------------------------------
-- 4. dividas_fixas
-- -------------------------------------------------------------------------
create table if not exists public.dividas_fixas (
  id              uuid primary key default gen_random_uuid(),
  conta_id        uuid not null references public.contas (id) on delete cascade,
  nome            text not null,
  valor_centavos  bigint not null check (valor_centavos >= 0),
  dia_vencimento  smallint not null check (dia_vencimento between 1 and 31),
  recorrente      boolean not null default true,
  mes_inicio      date not null default date_trunc('month', now())::date,
  mes_fim         date,
  atribuido_a     text not null default 'eu',
  ativo           boolean not null default true,
  criado_por      uuid references public.usuarios (id),
  criado_em       timestamptz not null default now(),
  editado_por     uuid references public.usuarios (id),
  editado_em      timestamptz
);

create index if not exists dividas_fixas_conta_id_idx on public.dividas_fixas (conta_id);

-- -------------------------------------------------------------------------
-- 5. compras (gasto parcelado ou à vista em cartão)
-- -------------------------------------------------------------------------
create table if not exists public.compras (
  id                  uuid primary key default gen_random_uuid(),
  conta_id            uuid not null references public.contas (id) on delete cascade,
  cartao_id           uuid not null references public.cartoes (id) on delete restrict,
  descricao           text not null,
  valor_total_centavos bigint not null check (valor_total_centavos > 0),
  numero_parcelas     int not null check (numero_parcelas >= 1),
  mes_inicio          date not null,
  atribuido_a         text not null default 'eu',
  criado_por          uuid references public.usuarios (id),
  criado_em           timestamptz not null default now(),
  editado_por         uuid references public.usuarios (id),
  editado_em          timestamptz
);

create index if not exists compras_conta_id_idx on public.compras (conta_id);
create index if not exists compras_cartao_id_idx on public.compras (cartao_id);

-- -------------------------------------------------------------------------
-- 6. parcelas (geradas a partir de compras — uma linha por mês)
-- -------------------------------------------------------------------------
create table if not exists public.parcelas (
  id                  uuid primary key default gen_random_uuid(),
  conta_id            uuid not null references public.contas (id) on delete cascade,
  compra_id           uuid not null references public.compras (id) on delete cascade,
  numero_da_parcela   int not null,
  mes_referencia      date not null,
  valor_centavos      bigint not null check (valor_centavos >= 0),
  status              text not null default 'pendente'
                        check (status in ('pendente', 'pago_no_mes', 'quitado_antecipado')),
  data_pagamento_real date,
  criado_em           timestamptz not null default now(),
  unique (compra_id, numero_da_parcela)
);

create index if not exists parcelas_conta_id_idx on public.parcelas (conta_id);
create index if not exists parcelas_compra_id_idx on public.parcelas (compra_id);
create index if not exists parcelas_mes_referencia_idx on public.parcelas (mes_referencia);

-- -------------------------------------------------------------------------
-- 6b. dividas_fixas_status (override esparso de status por mês)
-- Uma dívida fixa recorrente não tem N linhas materializadas (poderia ser
-- infinito) — por padrão toda instância mensal é "pendente". Só criamos uma
-- linha aqui quando o usuário marca uma ocorrência específica como paga ou
-- quitada antecipadamente.
-- -------------------------------------------------------------------------
create table if not exists public.dividas_fixas_status (
  id                  uuid primary key default gen_random_uuid(),
  conta_id            uuid not null references public.contas (id) on delete cascade,
  divida_fixa_id      uuid not null references public.dividas_fixas (id) on delete cascade,
  mes_referencia      date not null,
  status              text not null default 'pendente'
                        check (status in ('pendente', 'pago_no_mes', 'quitado_antecipado')),
  data_pagamento_real date,
  criado_em           timestamptz not null default now(),
  unique (divida_fixa_id, mes_referencia)
);

create index if not exists dividas_fixas_status_conta_id_idx on public.dividas_fixas_status (conta_id);
create index if not exists dividas_fixas_status_divida_fixa_id_idx on public.dividas_fixas_status (divida_fixa_id);

-- -------------------------------------------------------------------------
-- 7. divisoes_gasto (divisão parcial de um gasto do próprio usuário)
-- -------------------------------------------------------------------------
create table if not exists public.divisoes_gasto (
  id              uuid primary key default gen_random_uuid(),
  conta_id        uuid not null references public.contas (id) on delete cascade,
  compra_id       uuid not null references public.compras (id) on delete cascade,
  nome_da_pessoa  text not null,
  valor_centavos  bigint not null check (valor_centavos >= 0),
  status          text not null default 'a_cobrar' check (status in ('a_cobrar', 'recebido')),
  mes_referencia  date not null,
  criado_em       timestamptz not null default now()
);

create index if not exists divisoes_gasto_conta_id_idx on public.divisoes_gasto (conta_id);
create index if not exists divisoes_gasto_compra_id_idx on public.divisoes_gasto (compra_id);

-- -------------------------------------------------------------------------
-- 8. configuracoes (uma linha por conta)
-- -------------------------------------------------------------------------
create table if not exists public.configuracoes (
  conta_id                          uuid primary key references public.contas (id) on delete cascade,
  renda_mensal_esperada_centavos    bigint not null default 0,
  limite_uso_cartao_mes_centavos    bigint,
  faixa_verde_pct                   numeric not null default 60,
  faixa_amarela_pct                 numeric not null default 90,
  atualizado_em                     timestamptz not null default now()
);

-- =========================================================================
-- RLS — isolamento total por conta_id
-- =========================================================================
alter table public.contas          enable row level security;
alter table public.usuarios        enable row level security;
alter table public.cartoes         enable row level security;
alter table public.dividas_fixas   enable row level security;
alter table public.compras         enable row level security;
alter table public.parcelas        enable row level security;
alter table public.dividas_fixas_status enable row level security;
alter table public.divisoes_gasto  enable row level security;
alter table public.configuracoes   enable row level security;

-- contas: só é visível/editável por quem pertence a ela
drop policy if exists contas_select on public.contas;
create policy contas_select on public.contas
  for select using (id = public.current_conta_id());

drop policy if exists contas_update on public.contas;
create policy contas_update on public.contas
  for update using (id = public.current_conta_id() and public.current_papel() = 'owner');

-- usuarios: enxerga a si mesmo e todos da mesma conta
drop policy if exists usuarios_select on public.usuarios;
create policy usuarios_select on public.usuarios
  for select using (id = auth.uid() or conta_id = public.current_conta_id());

drop policy if exists usuarios_insert on public.usuarios;
create policy usuarios_insert on public.usuarios
  for insert with check (id = auth.uid() or conta_id = public.current_conta_id());

drop policy if exists usuarios_update on public.usuarios;
create policy usuarios_update on public.usuarios
  for update using (id = auth.uid() or (conta_id = public.current_conta_id() and public.current_papel() = 'owner'));

drop policy if exists usuarios_delete on public.usuarios;
create policy usuarios_delete on public.usuarios
  for delete using (conta_id = public.current_conta_id() and public.current_papel() = 'owner' and id <> auth.uid());

-- tabelas de negócio: isolamento simples por conta_id (owner e membro têm mesmo acesso)
drop policy if exists cartoes_all on public.cartoes;
create policy cartoes_all on public.cartoes
  for all using (conta_id = public.current_conta_id())
  with check (conta_id = public.current_conta_id());

drop policy if exists dividas_fixas_all on public.dividas_fixas;
create policy dividas_fixas_all on public.dividas_fixas
  for all using (conta_id = public.current_conta_id())
  with check (conta_id = public.current_conta_id());

drop policy if exists compras_all on public.compras;
create policy compras_all on public.compras
  for all using (conta_id = public.current_conta_id())
  with check (conta_id = public.current_conta_id());

drop policy if exists parcelas_all on public.parcelas;
create policy parcelas_all on public.parcelas
  for all using (conta_id = public.current_conta_id())
  with check (conta_id = public.current_conta_id());

drop policy if exists dividas_fixas_status_all on public.dividas_fixas_status;
create policy dividas_fixas_status_all on public.dividas_fixas_status
  for all using (conta_id = public.current_conta_id())
  with check (conta_id = public.current_conta_id());

drop policy if exists divisoes_gasto_all on public.divisoes_gasto;
create policy divisoes_gasto_all on public.divisoes_gasto
  for all using (conta_id = public.current_conta_id())
  with check (conta_id = public.current_conta_id());

drop policy if exists configuracoes_all on public.configuracoes;
create policy configuracoes_all on public.configuracoes
  for all using (conta_id = public.current_conta_id())
  with check (conta_id = public.current_conta_id());

-- =========================================================================
-- Bootstrap: criação de conta + usuário owner no primeiro signup
-- (chamado explicitamente pela aplicação via RPC, não por trigger em
-- auth.users, para permitir escolher o nome da conta no onboarding)
-- =========================================================================
create or replace function public.criar_conta_e_owner(p_nome_conta text, p_nome_usuario text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conta_id uuid;
begin
  if exists (select 1 from public.usuarios where id = auth.uid()) then
    raise exception 'Usuário já pertence a uma conta';
  end if;

  insert into public.contas (nome) values (p_nome_conta) returning id into v_conta_id;

  insert into public.usuarios (id, conta_id, nome, email, papel)
  values (auth.uid(), v_conta_id, p_nome_usuario, auth.jwt() ->> 'email', 'owner');

  insert into public.configuracoes (conta_id) values (v_conta_id);

  return v_conta_id;
end;
$$;
