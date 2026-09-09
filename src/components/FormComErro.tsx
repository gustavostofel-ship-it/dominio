"use client";

import { useActionState } from "react";
import type { ResultadoAcao } from "@/app/actions/auth";

export function FormComErro({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<ResultadoAcao>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState<ResultadoAcao, FormData>(async (_prev, formData) => {
    return action(formData);
  }, {});

  return (
    <form action={formAction} className={className}>
      {children}
      {state?.erro && (
        <p className="mt-3 rounded-lg bg-vermelho-100 px-3 py-2 text-sm text-vermelho-700">{state.erro}</p>
      )}
    </form>
  );
}
