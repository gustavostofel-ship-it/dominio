import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { criarContaEOwner } from "@/app/actions/auth";
import { FormComErro } from "@/components/FormComErro";
import { SubmitButton } from "@/components/SubmitButton";
import { Campo } from "@/components/Campo";

export default async function CriarContaPage() {
  const supabase = await criarClienteSupabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: usuarioExistente } = await supabase
    .from("usuarios")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (usuarioExistente) redirect("/dashboard");

  const nomeSugerido = (user.user_metadata?.nome as string | undefined) ?? "";

  return (
    <>
      <h1 className="text-xl font-bold">Quase lá</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Dê um nome para sua conta (ex.: sobrenome da família). Depois você pode convidar mais
        pessoas para usar o mesmo espaço.
      </p>

      <FormComErro action={criarContaEOwner} className="mt-6 flex flex-col gap-4">
        <Campo label="Seu nome" name="nome_usuario" defaultValue={nomeSugerido} required />
        <Campo label="Nome da conta" name="nome_conta" placeholder="Ex.: Família Stofel" required />
        <SubmitButton className="w-full">Continuar</SubmitButton>
      </FormComErro>
    </>
  );
}
