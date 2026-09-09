import { exigirUsuarioComConta } from "@/lib/data/context";
import { convidarUsuario, removerUsuario } from "@/app/actions/usuarios";
import type { UsuarioRow } from "@/types/database";
import { FormComErro } from "@/components/FormComErro";
import { SubmitButton } from "@/components/SubmitButton";
import { Campo } from "@/components/Campo";

export default async function UsuariosPage() {
  const { supabase, usuario } = await exigirUsuarioComConta();

  const { data } = await supabase
    .from("usuarios")
    .select("*")
    .eq("conta_id", usuario.conta_id)
    .order("criado_em");

  const usuarios = (data ?? []) as UsuarioRow[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Usuários da conta</h1>
        <p className="text-sm text-foreground-muted">
          Quem pode ver e cadastrar dívidas nesse mesmo espaço (ex.: você e sua esposa).
        </p>
      </div>

      {usuario.papel === "owner" ? (
        <section className="card p-6">
          <h2 className="font-semibold">Convidar alguém</h2>
          <FormComErro action={convidarUsuario} className="mt-4 grid gap-4 sm:grid-cols-2">
            <Campo label="Nome" name="nome" required />
            <Campo label="Email" name="email" type="email" required />
            <SubmitButton className="sm:col-span-2 sm:w-fit">Enviar convite</SubmitButton>
          </FormComErro>
        </section>
      ) : (
        <p className="card p-6 text-sm text-foreground-muted">
          Só o dono da conta pode convidar ou remover usuários.
        </p>
      )}

      <section className="card p-6">
        <h2 className="font-semibold">Pessoas nesta conta</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {usuarios.map((u) => (
            <li key={u.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="font-medium">
                  {u.nome} {u.id === usuario.id && <span className="text-xs text-foreground-muted">(você)</span>}
                </p>
                <p className="text-xs text-foreground-muted">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="status-pill status-pill--verde">{u.papel === "owner" ? "Dono da conta" : "Membro"}</span>
                {usuario.papel === "owner" && u.id !== usuario.id && (
                  <form
                    action={async (formData) => {
                      "use server";
                      await removerUsuario(formData);
                    }}
                  >
                    <input type="hidden" name="id" value={u.id} />
                    <button type="submit" className="text-sm font-medium text-vermelho-600 hover:underline">
                      Remover
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
