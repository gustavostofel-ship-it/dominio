import { exigirUsuarioComConta } from "@/lib/data/context";
import { NavBar } from "@/components/NavBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { usuario } = await exigirUsuarioComConta();

  return (
    <div className="flex-1 flex flex-col md:flex-row">
      <NavBar nomeUsuario={usuario.nome} papel={usuario.papel} />
      <main className="flex-1 bg-surface-muted px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
