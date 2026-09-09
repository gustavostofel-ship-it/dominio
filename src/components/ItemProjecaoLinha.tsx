import { quitarParcelaAntecipadamente } from "@/app/actions/parcelas";
import { definirStatusOcorrenciaDividaFixa } from "@/app/actions/dividas-fixas-status";
import { formatarBRL, type ItemProjecao } from "@/lib/calc";

/**
 * Linha de item usada na projeção para meses FUTUROS: permite quitação
 * antecipada (7.9) de uma parcela ou dívida fixa antes do vencimento.
 * Funciona como Server Component puro (progressive enhancement via
 * server actions), sem precisar de JS no cliente.
 */
export function ItemProjecaoLinha({ item, mes }: { item: ItemProjecao; mes: string }) {
  const jaQuitado = item.status !== "pendente";

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2 text-sm">
      <span className={jaQuitado ? "text-foreground-muted line-through" : ""}>{item.nome}</span>
      <div className="flex items-center gap-3">
        <span className="font-medium">{formatarBRL(item.valorCentavos)}</span>
        {jaQuitado ? (
          <span className="status-pill status-pill--verde">Quitado antecipado</span>
        ) : item.origem === "parcela" ? (
          <form
            action={async (formData) => {
              "use server";
              await quitarParcelaAntecipadamente(formData);
            }}
          >
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" className="rounded-lg border border-border px-3 py-1 text-xs font-medium hover:bg-surface-muted">
              Quitar antecipadamente
            </button>
          </form>
        ) : (
          <form
            action={async (formData) => {
              "use server";
              await definirStatusOcorrenciaDividaFixa(formData);
            }}
          >
            <input type="hidden" name="divida_fixa_id" value={item.id.split("|")[0]} />
            <input type="hidden" name="mes_referencia" value={mes} />
            <input type="hidden" name="novo_status" value="quitado_antecipado" />
            <button type="submit" className="rounded-lg border border-border px-3 py-1 text-xs font-medium hover:bg-surface-muted">
              Quitar antecipadamente
            </button>
          </form>
        )}
      </div>
    </li>
  );
}
