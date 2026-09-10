"use client";

export type ModoValor = "total" | "parcela";

/**
 * Escolha entre informar o valor TOTAL da compra (o sistema divide pelas
 * parcelas) ou o valor DE CADA PARCELA (o sistema multiplica) — ex.: "R$
 * 200 em 4x" vs "4x de R$ 50". A segunda forma é como a maioria lê a
 * própria fatura do cartão, então facilita bastante na hora de migrar
 * dívidas já existentes.
 */
export function SeletorModoValor({ modo, onMudar }: { modo: ModoValor; onMudar: (modo: ModoValor) => void }) {
  return (
    <div className="flex items-center gap-4 text-sm sm:col-span-2">
      <span className="font-medium">Como prefere informar?</span>
      <label className="flex items-center gap-1.5">
        <input
          type="radio"
          checked={modo === "total"}
          onChange={() => onMudar("total")}
          className="h-4 w-4 accent-verde-600"
        />
        Valor total
      </label>
      <label className="flex items-center gap-1.5">
        <input
          type="radio"
          checked={modo === "parcela"}
          onChange={() => onMudar("parcela")}
          className="h-4 w-4 accent-verde-600"
        />
        Valor de cada parcela
      </label>
      <input type="hidden" name="modo_valor" value={modo} />
    </div>
  );
}
