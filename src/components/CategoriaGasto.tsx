import type { CategoriaGasto } from "@/types/database";

export const ROTULOS_CATEGORIA: Record<CategoriaGasto, string> = {
  fixa: "Fixa essencial",
  assinatura: "Assinatura",
  divida_pessoa: "Dívida com pessoa",
  lazer: "Lazer",
  outros: "Outros",
};

const CORES_CATEGORIA: Record<CategoriaGasto, string> = {
  fixa: "bg-gray-100 text-gray-700",
  assinatura: "bg-blue-100 text-blue-700",
  divida_pessoa: "bg-purple-100 text-purple-700",
  lazer: "bg-pink-100 text-pink-700",
  outros: "bg-amber-100 text-amber-700",
};

/** Cor "sólida" (pra barra/gráfico) de cada categoria — mesmo tom das pills. */
export const CORES_GRAFICO_CATEGORIA: Record<CategoriaGasto, string> = {
  fixa: "#6b7280",
  assinatura: "#3b82f6",
  divida_pessoa: "#a855f7",
  lazer: "#ec4899",
  outros: "#d97706",
};

export function CategoriaPill({ categoria }: { categoria: CategoriaGasto }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${CORES_CATEGORIA[categoria]}`}
    >
      {ROTULOS_CATEGORIA[categoria]}
    </span>
  );
}

const ORDEM_CATEGORIAS: CategoriaGasto[] = ["fixa", "assinatura", "lazer", "divida_pessoa", "outros"];

/** <select> nativo com as categorias — pra usar dentro de qualquer form. */
export function SeletorCategoria({
  defaultValue = "outros",
  categoriasDisponiveis = ORDEM_CATEGORIAS,
}: {
  defaultValue?: CategoriaGasto;
  /** Restringe as opções mostradas (ex.: dívida fixa não costuma ser "outros"). */
  categoriasDisponiveis?: CategoriaGasto[];
}) {
  const DESCRICOES: Record<CategoriaGasto, string> = {
    fixa: "Fixa essencial (não dá pra cortar)",
    assinatura: "Assinatura (dá pra cortar se precisar)",
    divida_pessoa: "Dívida com pessoa (devo a alguém, não é um compromisso fixo)",
    lazer: "Lazer (passeio, restaurante, compra não essencial)",
    outros: "Outros / gasto do dia a dia",
  };

  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      Categoria
      <select
        name="categoria"
        defaultValue={defaultValue}
        className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-verde-500 focus:ring-2 focus:ring-verde-100"
      >
        {categoriasDisponiveis.map((c) => (
          <option key={c} value={c}>
            {DESCRICOES[c]}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Ordem fixa usada em resumos/gráficos, pra sempre aparecer na mesma sequência. */
export function ordemCategorias(): CategoriaGasto[] {
  return ORDEM_CATEGORIAS;
}
