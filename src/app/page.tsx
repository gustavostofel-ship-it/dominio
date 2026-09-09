import Link from "next/link";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await criarClienteSupabaseServidor();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims ?? null;

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
          <span className="text-lg font-bold text-verde-700">Domínio</span>
          <nav className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-verde-600 px-4 py-2 text-sm font-semibold text-white hover:bg-verde-700"
              >
                Ir para o dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-foreground-muted hover:text-foreground">
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="rounded-lg bg-verde-600 px-4 py-2 text-sm font-semibold text-white hover:bg-verde-700"
                >
                  Criar conta grátis
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <p className="mb-4 inline-block rounded-full bg-verde-100 px-3 py-1 text-xs font-semibold text-verde-700">
            Para quem está enrolado com cartão e quer clareza
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Pare de perder o controle das suas dívidas de cartão.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-foreground-muted">
            Domínio substitui a planilha por um sistema sem margem de erro. Você sabe exatamente
            quanto deve, mês a mês, nos próximos 12 meses — sem ser pego de surpresa por uma
            fatura, e sem precisar somar nada na mão.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/cadastro"
              className="rounded-lg bg-verde-600 px-6 py-3 text-sm font-semibold text-white hover:bg-verde-700"
            >
              Assumir o controle agora
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface-muted"
            >
              Já tenho conta
            </Link>
          </div>
        </section>

        <section className="border-t border-border bg-surface-muted">
          <div className="mx-auto max-w-5xl px-6 py-14 grid gap-8 sm:grid-cols-3">
            <Feature
              titulo="Nunca mais uma conta errada"
              texto="Toda soma e projeção é feita em centavos, testada automaticamente. Zero espaço para erro de arredondamento ou de fórmula quebrada."
            />
            <Feature
              titulo="Separe o que é seu do que é de terceiro"
              texto="Cartão emprestado pro irmão? Gasto dividido com um amigo? O sistema separa isso do seu total sem você precisar lembrar de nada."
            />
            <Feature
              titulo="Feito para usar em família"
              texto="Você e sua esposa no mesmo espaço, cada lançamento com nome e data de quem cadastrou. Ninguém mais fica perdido sobre a origem de um gasto."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-foreground-muted">
        Domínio — controle financeiro pessoal e familiar.
      </footer>
    </div>
  );
}

function Feature({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="card p-6">
      <h3 className="font-semibold text-verde-700">{titulo}</h3>
      <p className="mt-2 text-sm text-foreground-muted">{texto}</p>
    </div>
  );
}
