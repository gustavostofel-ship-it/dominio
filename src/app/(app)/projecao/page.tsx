import { exigirUsuarioComConta } from "@/lib/data/context";
import { carregarProjecao, statusDoResumo } from "@/lib/data/projecao";
import { formatarBRL } from "@/lib/calc";
import { StatusPill } from "@/components/StatusPill";
import { ItemProjecaoLinha } from "@/components/ItemProjecaoLinha";

const NOMES_MES = [
  "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez",
];

function rotuloMesCurto(mesRef: string): string {
  const [ano, mes] = mesRef.split("-").map(Number);
  return `${NOMES_MES[mes - 1]}/${String(ano).slice(2)}`;
}

export default async function ProjecaoPage() {
  const ctx = await exigirUsuarioComConta();
  const dados = await carregarProjecao(ctx, { quantidadeMeses: 12 });

  const maiorValor = Math.max(1, ...dados.resumos.map((r) => r.totalDevidoCentavos));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Projeção de 12 meses</h1>
        <p className="text-sm text-foreground-muted">
          Tudo que vence à frente, para você se planejar antes de assumir um novo compromisso.
        </p>
      </div>

      <section className="card p-6">
        <div className="flex items-end gap-2 overflow-x-auto pb-2">
          {dados.resumos.map((resumo) => {
            const alturaPct = Math.max(4, (resumo.totalDevidoCentavos / maiorValor) * 100);
            return (
              <div key={resumo.mesReferencia} className="flex w-20 shrink-0 flex-col items-center gap-1">
                <span className="text-xs font-medium text-foreground-muted">
                  {formatarBRL(resumo.totalDevidoCentavos)}
                </span>
                <div className="flex h-32 w-full items-end">
                  <div className="w-full rounded-t-md bg-verde-500" style={{ height: `${alturaPct}%` }} />
                </div>
                <span className="text-xs font-semibold">{rotuloMesCurto(resumo.mesReferencia)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card overflow-x-auto p-6">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-foreground-muted">
              <th className="py-2 font-medium">Mês</th>
              <th className="py-2 font-medium">Você deve</th>
              <th className="py-2 font-medium">Já pago</th>
              <th className="py-2 font-medium">De terceiros</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {dados.resumos.map((resumo) => (
              <tr key={resumo.mesReferencia} className="border-b border-border last:border-0">
                <td className="py-3 font-medium">{rotuloMesCurto(resumo.mesReferencia)}</td>
                <td className="py-3">{formatarBRL(resumo.totalDevidoCentavos)}</td>
                <td className="py-3 text-foreground-muted">{formatarBRL(resumo.totalPagoCentavos)}</td>
                <td className="py-3 text-foreground-muted">{formatarBRL(resumo.totalTerceirosCentavos)}</td>
                <td className="py-3">
                  <StatusPill status={statusDoResumo(resumo, dados.configuracoes)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Detalhe por mês e quitação antecipada</h2>
        {dados.resumos.map((resumo) => {
          const itensProprios = resumo.itens.filter((i) => i.atribuidoA === "eu");
          return (
            <details key={resumo.mesReferencia} className="card p-4">
              <summary className="cursor-pointer text-sm font-semibold">
                {rotuloMesCurto(resumo.mesReferencia)} — {itensProprios.length} item(ns)
              </summary>
              <ul className="mt-3 flex flex-col gap-2">
                {itensProprios.map((item) => (
                  <ItemProjecaoLinha key={item.id} item={item} mes={resumo.mesReferencia} />
                ))}
                {itensProprios.length === 0 && (
                  <p className="text-sm text-foreground-muted">Nada lançado para este mês.</p>
                )}
              </ul>
            </details>
          );
        })}
      </section>
    </div>
  );
}
