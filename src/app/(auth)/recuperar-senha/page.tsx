"use client";

import { useActionState } from "react";
import Link from "next/link";
import { solicitarRecuperacaoSenha, type ResultadoAcao } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { Campo } from "@/components/Campo";

interface Estado extends ResultadoAcao {
  enviado?: boolean;
}

export default function RecuperarSenhaPage() {
  const [state, formAction] = useActionState<Estado, FormData>(async (_prev, formData) => {
    const resultado = await solicitarRecuperacaoSenha(formData);
    if (resultado.erro) return resultado;
    return { enviado: true };
  }, {});

  return (
    <>
      <h1 className="text-xl font-bold">Recuperar senha</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Informe seu email e enviaremos um link para redefinir sua senha.
      </p>

      {state.enviado ? (
        <p className="mt-6 rounded-lg bg-verde-100 px-3 py-2 text-sm text-verde-700">
          Se esse email existir na nossa base, você vai receber um link em instantes.
        </p>
      ) : (
        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <Campo label="Email" name="email" type="email" required autoComplete="email" />
          {state.erro && (
            <p className="rounded-lg bg-vermelho-100 px-3 py-2 text-sm text-vermelho-700">{state.erro}</p>
          )}
          <SubmitButton className="w-full">Enviar link</SubmitButton>
        </form>
      )}

      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="font-medium text-verde-700 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </>
  );
}
