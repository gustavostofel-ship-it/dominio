import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para uso em Server Components, Server Actions e Route
 * Handlers. Lê/escreve a sessão via cookies do Next.js.
 *
 * Sem generic <Database>: o schema é tipado manualmente por tabela em
 * src/types/database.ts e aplicado via cast nas queries (ex.: `as CartaoRow[]`).
 */
export async function criarClienteSupabaseServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // chamado a partir de um Server Component sem permissão de
            // escrita — o middleware já cuida de renovar a sessão.
          }
        },
      },
    }
  );
}

/**
 * Cliente com a service role key — só deve ser usado em server actions que
 * precisam de privilégios administrativos (ex.: convidar um novo usuário
 * via Supabase Auth Admin API). Nunca importar em código de cliente.
 */
export async function criarClienteSupabaseAdmin() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
