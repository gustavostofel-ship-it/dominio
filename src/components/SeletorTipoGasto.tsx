"use client";

export type TipoGasto = "parcelada" | "assinatura" | "emprestado";

/**
 * Lançar gasto tem 3 tipos bem diferentes, cada um virando um registro
 * diferente no sistema:
 *
 * - "parcelada": tem fim definido (geladeira em 8x, empréstimo em 12x, ou
 *   até uma compra à vista/1x). Vira uma compra no cartão.
 * - "assinatura": sem fim definido, continua até você cancelar (Netflix,
 *   internet, um app que você assinou hoje). Vira uma dívida fixa
 *   recorrente com categoria "assinatura".
 * - "emprestado": dinheiro que você deve pra uma pessoa — sem fim
 *   definido, ou com data pra acabar se você já souber (ex.: "vou
 *   pagando em 5x"). Vira uma dívida fixa recorrente com categoria
 *   "dívida com pessoa".
 *
 * Dívida fixa essencial (aluguel, luz, água) não é nenhum desses três —
 * tem área própria em "Assinaturas e dívidas".
 */
export function SeletorTipoGasto({ tipo, onMudar }: { tipo: TipoGasto; onMudar: (tipo: TipoGasto) => void }) {
  const opcoes: { valor: TipoGasto; titulo: string; descricao: string }[] = [
    {
      valor: "parcelada",
      titulo: "Compra no cartão",
      descricao: "Tem fim definido — geladeira em 8x, empréstimo em 12x, ou até uma compra à vista (1x).",
    },
    {
      valor: "assinatura",
      titulo: "Assinatura",
      descricao: "Sem fim definido, continua até você cancelar — Netflix, internet, um app que assinou hoje.",
    },
    {
      valor: "emprestado",
      titulo: "Dinheiro emprestado",
      descricao: "Dívida com uma pessoa — sem fim definido, ou com prazo se você já souber (ex.: em 5x).",
    },
  ];

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="text-sm font-medium">Que tipo de gasto é esse?</span>
      <div className="grid gap-2 sm:grid-cols-3">
        {opcoes.map((opcao) => (
          <label
            key={opcao.valor}
            className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border px-4 py-3 text-sm ${
              tipo === opcao.valor ? "border-verde-500 bg-verde-50" : "border-border"
            }`}
          >
            <span className="flex items-center gap-1.5 font-semibold">
              <input
                type="radio"
                checked={tipo === opcao.valor}
                onChange={() => onMudar(opcao.valor)}
                className="h-4 w-4 accent-verde-600"
              />
              {opcao.titulo}
            </span>
            <span className="text-foreground-muted">{opcao.descricao}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
