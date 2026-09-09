import Link from "next/link";
import { entrar } from "@/app/actions/auth";
import { FormComErro } from "@/components/FormComErro";
import { SubmitButton } from "@/components/SubmitButton";
import { Campo } from "@/components/Campo";

export default function LoginPage() {
  return (
    <>
      <h1 className="text-xl font-bold">Entrar</h1>
      <p className="mt-1 text-sm text-foreground-muted">Acesse sua conta Domínio.</p>

      <FormComErro action={entrar} className="mt-6 flex flex-col gap-4">
        <Campo label="Email" name="email" type="email" required autoComplete="email" />
        <Campo label="Senha" name="senha" type="password" required autoComplete="current-password" />
        <SubmitButton className="w-full">Entrar</SubmitButton>
      </FormComErro>

      <div className="mt-4 flex flex-col gap-2 text-center text-sm">
        <Link href="/recuperar-senha" className="text-verde-700 hover:underline">
          Esqueci minha senha
        </Link>
        <span className="text-foreground-muted">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-verde-700 hover:underline">
            Criar conta
          </Link>
        </span>
      </div>
    </>
  );
}
