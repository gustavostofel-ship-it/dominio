"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import clsx from "clsx";
import { IconRefresh } from "@/components/icons";

/**
 * Busca os dados da tela atual de novo, sem navegar — útil quando outra
 * pessoa da conta (ex.: esposa) mexeu em algo e a tela ainda não reflete.
 */
export function BotaoAtualizar({ className }: { className?: string }) {
  const router = useRouter();
  const [atualizando, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => router.refresh())}
      disabled={atualizando}
      aria-label="Atualizar dados desta tela"
      title="Atualizar"
      className={clsx(
        "rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-60",
        className
      )}
    >
      <IconRefresh className={clsx("h-5 w-5", atualizando && "animate-spin")} />
    </button>
  );
}
