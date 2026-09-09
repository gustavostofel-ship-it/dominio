import { exigirUsuarioComConta } from "@/lib/data/context";
import { carregarProjecao } from "@/lib/data/projecao";
import { mesAtual, formatarBRL } from "@/lib/calc";
import { ItemCheckMes } from "@/components/ItemCheckMes";

export default async function CheckMesPage() {
  const ctx = await exigirUsuarioComConta();
  const mes = mesAtual();
  const dados = await carregarProjecao(ctx, { mesInicio: mes, quantidadeMeses: 1 });
  const resumo = dados.resumos[0];

  const itensProprios = resumo.itens
    .filter((i) => i.atribuidoA === "eu")
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const pendentes = itensProprios.filter((i) => i.status === "pendente");
  const pagos = itensProprios.filter((i) => i.status !== "pendente");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Check do mês</h1>
        <p className="text-sm text-foreground-muted">
          Tudo que vence este mês. Total pendente: <strong>{formatarBRL(resumo.totalDevidoCentavos)}</strong>
        </p>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold">Pendentes ({pendentes.length})</h2>
        {pendentes.length === 0 ? (
          <p className="mt-3 text-sm text-foreground-muted">Nada pendente este mês. 🎉</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {pendentes.map((item) => (
              <ItemCheckMes key={item.id} item={item} mes={mes} />
            ))}
          </ul>
        )}
      </section>

      <section className="card p-6">
        <h2 className="font-semibold">Já pagos ({pagos.length})</h2>
        {pagos.length === 0 ? (
          <p className="mt-3 text-sm text-foreground-muted">Nenhum pagamento registrado ainda.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {pagos.map((item) => (
              <ItemCheckMes key={item.id} item={item} mes={mes} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
