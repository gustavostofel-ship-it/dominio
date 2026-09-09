"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ResultadoAcao } from "@/app/actions/auth";

export function FormComErro({
  action,
  children,
  className,
  onSucesso,
}: {
  action: (formData: FormData) => Promise<ResultadoAcao>;
  children: React.ReactNode;
  className?: string;
  /** Chamado quando a ação termina sem erro (ex.: fechar um modo de edição). */
  onSucesso?: () => void;
}) {
  const [state, formAction] = useActionState<ResultadoAcao, FormData>(async (_prev, formData) => {
    return action(formData);
  }, {});

  // "state" é um objeto novo a cada submissão (mesmo quando o resultado é
  // o mesmo {} de sucesso), então comparar sua identidade entre renders
  // (em vez do valor) é o que garante que isso dispare uma vez por
  // submissão bem-sucedida, não a cada render.
  const ultimoStateVisto = useRef(state);
  useEffect(() => {
    if (state !== ultimoStateVisto.current) {
      ultimoStateVisto.current = state;
      if (!state?.erro) onSucesso?.();
    }
  }, [state, onSucesso]);

  return (
    <form action={formAction} className={className}>
      {children}
      {state?.erro && (
        <p className="mt-3 rounded-lg bg-vermelho-100 px-3 py-2 text-sm text-vermelho-700">{state.erro}</p>
      )}
    </form>
  );
}
