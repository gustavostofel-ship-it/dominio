"use client";

export type TipoMigracao = "parcelada" | "recorrente";

/**
 * Na migração rápida, a dívida existente pode ser de dois tipos bem
 * diferentes — e cada um tem um jeito diferente de "acabar":
 *
 * - "parcelada": tem fim definido, um número fixo de parcelas restantes
 *   (ex.: geladeira em 8x, empréstimo em 12x). Vira uma compra no cartão.
 * - "recorrente": não tem fim definido, continua cobrando todo mês até
 *   você decidir cancelar (ex.: Netflix, internet, conta de luz, aluguel,
 *   uma dívida com uma pessoa que ainda não sabe quando acaba). Vira uma
 *   dívida fixa, sem "número de parcelas".
 */
export function SeletorTipoMigracao({ tipo, onMudar }: { tipo: TipoMigracao; onMudar: (tipo: TipoMigracao) => void }) {
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="text-sm font-medium">O que você está cadastrando?</span>
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
            Compra parcelada
          </span>
          <span className="text-foreground-muted">Tem fim definido — ex.: geladeira em 8x, empréstimo em 12x.</span>
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
            Conta recorrente
          </span>
          <span className="text-foreground-muted">
            Sem fim definido, continua até você cancelar — ex.: Netflix, internet, aluguel, dívida
            com uma pessoa.
          </span>
        </label>
      </div>
    </div>
  );
}
