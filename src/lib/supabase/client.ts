"use client";

import { createBrowserClient } from "@supabase/ssr";

// Sem generic <Database>: o schema é tipado manualmente por tabela em
// src/types/database.ts e aplicado via cast nas queries (ex.: `as CartaoRow[]`),
// em vez de depender de codegen do Supabase.
export function criarClienteSupabaseNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
