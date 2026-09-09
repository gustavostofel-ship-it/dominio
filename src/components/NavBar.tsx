"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { sair } from "@/app/actions/auth";

const ITENS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/check-mes", label: "Check do mês" },
  { href: "/projecao", label: "Projeção 12 meses" },
  { href: "/gastos/novo", label: "Lançar gasto" },
  { href: "/cartoes", label: "Cartões" },
  { href: "/dividas-fixas", label: "Dívidas fixas" },
  { href: "/historico", label: "Histórico" },
  { href: "/a-receber", label: "A receber" },
  { href: "/usuarios", label: "Usuários" },
  { href: "/configuracoes", label: "Configurações" },
];

export function NavBar({ nomeUsuario, papel }: { nomeUsuario: string; papel: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 border-b border-border bg-surface md:w-60 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-4 py-4 md:block md:px-5 md:py-6">
        <Link href="/dashboard" className="text-lg font-bold text-verde-700">
          Domínio
        </Link>
        <div className="hidden md:mt-1 md:block md:text-xs md:text-foreground-muted">
          {nomeUsuario} · {papel === "owner" ? "dono da conta" : "membro"}
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible md:px-3 md:pb-6">
        {ITENS.map((item) => {
          const ativo = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
                ativo ? "bg-verde-100 text-verde-700" : "text-foreground-muted hover:bg-surface-muted"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <form action={sair} className="hidden px-3 pb-6 md:block">
        <button
          type="submit"
          className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm font-medium text-foreground-muted hover:bg-surface-muted"
        >
          Sair
        </button>
      </form>
    </aside>
  );
}
