import Link from "next/link";
import { cadastrar } from "@/app/actions/auth";
import { FormComErro } from "@/components/FormComErro";
import { SubmitButton } from "@/components/SubmitButton";
import { Campo } from "@/components/Campo";

export default function CadastroPage() {
  return (
    <>
      <h1 className="text-xl font-bold">Criar conta</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Comece a organizar suas dívidas de cartão em poucos minutos.
      </p>

      <FormComErro action={cadastrar} className="mt-6 flex flex-col gap-4">
        <Campo label="Seu nome" name="nome" required autoComplete="name" />
        <Campo label="Email" name="email" type="email" required autoComplete="email" />
        <Campo
          label="Senha (mín. 8 caracteres)"
          name="senha"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
        <SubmitButton className="w-full">Criar conta</SubmitButton>
      </FormComErro>

      <p className="mt-4 text-center text-sm text-foreground-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-verde-700 hover:underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
