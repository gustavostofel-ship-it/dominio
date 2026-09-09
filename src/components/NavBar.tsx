"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { sair } from "@/app/actions/auth";
import { BotaoAtualizar } from "@/components/BotaoAtualizar";
import {
  IconDashboard,
  IconCheck,
  IconChart,
  IconPlus,
  IconCard,
  IconHome,
  IconClock,
  IconReceive,
  IconUsers,
  IconSettings,
  IconImport,
  IconMenu,
  IconClose,
  IconLogout,
} from "@/components/icons";

const ITENS = [
  { href: "/dashboard", label: "Dashboard", Icon: IconDashboard },
  { href: "/check-mes", label: "Check do mês", Icon: IconCheck },
  { href: "/projecao", label: "Projeção 12 meses", Icon: IconChart },
  { href: "/gastos/novo", label: "Lançar gasto", Icon: IconPlus },
  { href: "/onboarding", label: "Importar dívidas existentes", Icon: IconImport },
  { href: "/cartoes", label: "Cartões", Icon: IconCard },
  { href: "/dividas-fixas", label: "Dívidas fixas", Icon: IconHome },
  { href: "/historico", label: "Histórico", Icon: IconClock },
  { href: "/a-receber", label: "A receber", Icon: IconReceive },
  { href: "/usuarios", label: "Usuários", Icon: IconUsers },
  { href: "/configuracoes", label: "Configurações", Icon: IconSettings },
];

export function NavBar({ nomeUsuario, papel }: { nomeUsuario: string; papel: string }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  // Fecha o drawer sempre que a rota muda (navegação por link). Ajustar
  // estado durante a renderização (em vez de useEffect) evita um render
  // extra: https://react.dev/learn/you-might-not-need-an-effect
  const [pathnameAnterior, setPathnameAnterior] = useState(pathname);
  if (pathname !== pathnameAnterior) {
    setPathnameAnterior(pathname);
    setAberto(false);
  }

  return (
    <>
      {/* Topbar mobile — o botão fica do MESMO lado de onde a gaveta abre (esquerda),
          senão a animação parece não ter relação com o botão que a acionou. */}
      <header className="relative flex items-center border-b border-border bg-surface px-4 py-3 md:hidden">
        <button
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          className="rounded-lg p-2 text-foreground-muted hover:bg-surface-muted"
        >
          <IconMenu />
        </button>
        <Link
          href="/dashboard"
          className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-verde-700"
        >
          Domínio
        </Link>
        <BotaoAtualizar className="ml-auto" />
      </header>

      {/* Backdrop do drawer mobile */}
      {aberto && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setAberto(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar desktop + drawer mobile (mesmo markup, posicionamento muda por breakpoint) */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col bg-surface transition-transform duration-200 ease-out",
          "md:static md:inset-auto md:z-auto md:h-screen md:w-64 md:translate-x-0 md:border-r md:border-border md:shadow-none",
          aberto ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <Link href="/dashboard" className="text-lg font-bold text-verde-700">
              Domínio
            </Link>
            <p className="mt-0.5 text-xs text-foreground-muted">
              {nomeUsuario} · {papel === "owner" ? "dono da conta" : "membro"}
            </p>
          </div>
          <BotaoAtualizar className="hidden md:block" />
          <button
            onClick={() => setAberto(false)}
            aria-label="Fechar menu"
            className="rounded-lg p-2 text-foreground-muted hover:bg-surface-muted md:hidden"
          >
            <IconClose />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
          {ITENS.map(({ href, label, Icon }) => {
            const ativo = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  ativo
                    ? "bg-verde-100 text-verde-700"
                    : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
                )}
              >
                <Icon className={clsx("h-5 w-5 shrink-0", ativo ? "text-verde-600" : "text-foreground-muted")} />
                {label}
              </Link>
            );
          })}
        </nav>

        <form action={sair} className="border-t border-border px-3 py-4">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground-muted hover:bg-surface-muted hover:text-foreground"
          >
            <IconLogout />
            Sair
          </button>
        </form>
      </aside>
    </>
  );
}
