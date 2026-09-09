import { redefinirSenha } from "@/app/actions/auth";
import { FormComErro } from "@/components/FormComErro";
import { SubmitButton } from "@/components/SubmitButton";
import { Campo } from "@/components/Campo";

export default function RedefinirSenhaPage() {
  return (
    <>
      <h1 className="text-xl font-bold">Definir nova senha</h1>
      <p className="mt-1 text-sm text-foreground-muted">Escolha uma nova senha para sua conta.</p>

      <FormComErro action={redefinirSenha} className="mt-6 flex flex-col gap-4">
        <Campo
          label="Nova senha (mín. 8 caracteres)"
          name="senha"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
        <SubmitButton className="w-full">Salvar nova senha</SubmitButton>
      </FormComErro>
    </>
  );
}
