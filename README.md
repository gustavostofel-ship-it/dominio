# Domínio

Controle financeiro pessoal/familiar para quem está enrolado com cartões de
crédito e quer parar de depender de planilha. Cores: verde e branco.

Este repositório implementa a Fase 1 descrita na especificação funcional:
cadastro de cartões, dívidas fixas e compras parceladas, projeção de 12
meses, separação entre dívida própria e de terceiros, divisão parcial de
gastos, histórico completo e multiusuário por conta (multi-tenant).

## Stack

- **Next.js 16** (App Router, Server Actions, Server Components)
- **Supabase** (Postgres + Auth + Row Level Security para isolamento multi-tenant)
- **Tailwind CSS v4** (tema verde/branco)
- **Vitest** para os testes automatizados do motor de cálculo (`src/lib/calc`)

## Requisito não-negociável: zero erro de cálculo

Toda soma/projeção é feita em **centavos (inteiros)**, nunca em ponto
flutuante, em funções puras e 100% testadas em `src/lib/calc`:

- `parcelas.ts` — geração determinística de parcelas (o resto do
  arredondamento sempre vai para a última parcela, nunca se perde centavo).
- `dividas-fixas.ts` — quais meses uma dívida fixa recorrente se aplica.
- `projecao.ts` — soma mensal excluindo itens de terceiros.
- `status.ts` — status verde/amarelo/vermelho com faixas configuráveis.

Rode os testes com:

```bash
npm test
```

## Configurando o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **SQL Editor**, rode o conteúdo de `supabase/migrations/0001_init.sql`
   (cria as tabelas, RLS e a função `criar_conta_e_owner`).
3. Em **Authentication > Providers**, deixe Email habilitado. Se quiser
   liberar login imediato sem confirmação de email (bom para testar),
   desative "Confirm email" em **Authentication > Settings**.
4. Copie `.env.local.example` para `.env.local` e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     (Project Settings > API).
   - `SUPABASE_SERVICE_ROLE_KEY` (idem — usada só em server actions para
     convidar novos usuários da conta).

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. Fluxo inicial: `/cadastro` (cria o usuário)
→ `/cadastro/conta` (cria a conta/tenant e vira `owner`) → `/onboarding`
(migração rápida das dívidas da planilha) → `/dashboard`.

## Estrutura

```
src/lib/calc/        motor de cálculo puro (testado, sem I/O)
src/lib/data/        camada de acesso a dados (Supabase) + montagem da projeção
src/lib/supabase/    clientes Supabase (browser, server, middleware/proxy)
src/app/actions/     Server Actions (mutações) — um arquivo por entidade
src/app/(auth)/      login, cadastro, recuperação de senha
src/app/(app)/       telas autenticadas (dashboard, projeção, check do mês, ...)
supabase/migrations/ schema SQL + RLS
```

## Modelo multi-tenant

Toda tabela de negócio tem `conta_id` e RLS habilitada — a política usa
`public.current_conta_id()`, uma função `security definer` que resolve a
conta do usuário autenticado, então nenhuma query pode cruzar dados entre
contas diferentes, mesmo com bugs na aplicação. Papéis: `owner` (convida e
remove usuários) e `membro`.

## Fora de escopo na Fase 1

Integração bancária (open finance), cobrança automatizada da assinatura
SaaS e importação de fatura em PDF/CSV — ver a especificação funcional
completa para detalhes.
