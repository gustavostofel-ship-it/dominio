"use client";

export type TipoLancamento = "parcelada" | "recorrente";

/**
 * Todo gasto novo (seja lançado no dia a dia ou migrado da planilha) é de
 * um de dois tipos bem diferentes — e cada um tem um jeito diferente de
 * "acabar":
 *
 * - "parcelada": tem fim definido, um número fixo de parcelas (ex.:
 *   geladeira em 8x, empréstimo em 12x, compra do dia a dia à vista/1x).
 *   Vira uma compra no cartão.
 * - "recorrente": não tem fim definido, continua cobrando todo mês até
 *   você decidir cancelar (ex.: assinatura tipo Netflix, internet, conta
 *   de luz, aluguel, uma dívida com uma pessoa que ainda não sabe quando
 *   acaba). Vira uma dívida fixa, sem "número de parcelas" — e já nasce
 *   pronta pra usar o "Encerrar" quando você cancelar.
 */
export function SeletorTipoLancamento({
  tipo,
  onMudar,
}: {
  tipo: TipoLancamento;
  onMudar: (tipo: TipoLancamento) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="text-sm font-medium">Que tipo de gasto é esse?</span>
      <div className="grid gap-2 sm:grid-cols-2">
        <label
          className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border px-4 py-3 text-sm ${
            tipo === "parcelada" ? "border-verde-500 bg-verde-50" : "border-border"
          }`}
        >
          <span className="flex items-center gap-1.5 font-semibold">
            <input
              type="radio"
              checked={tipo === "parcelada"}
              onChange={() => onMudar("parcelada")}
              className="h-4 w-4 accent-verde-600"
            />
            Compra no cartão
          </span>
          <span className="text-foreground-muted">
            Tem fim definido — geladeira em 8x, empréstimo em 12x, ou até uma compra à vista (1x).
          </span>
        </label>
        <label
          className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border px-4 py-3 text-sm ${
            tipo === "recorrente" ? "border-verde-500 bg-verde-50" : "border-border"
          }`}
        >
          <span className="flex items-center gap-1.5 font-semibold">
            <input
              type="radio"
              checked={tipo === "recorrente"}
              onChange={() => onMudar("recorrente")}
              className="h-4 w-4 accent-verde-600"
            />
            Assinatura / dívida fixa
          </span>
          <span className="text-foreground-muted">
            Sem fim definido, continua até você cancelar — assinatura, aluguel, conta de luz,
            dívida com uma pessoa.
          </span>
        </label>
      </div>
    </div>
  );
}
