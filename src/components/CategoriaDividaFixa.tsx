import type { CategoriaDividaFixa } from "@/types/database";

export const ROTULOS_CATEGORIA: Record<CategoriaDividaFixa, string> = {
  fixa: "Fixa essencial",
  assinatura: "Assinatura",
  divida_pessoa: "Dívida com pessoa",
};

const CORES_CATEGORIA: Record<CategoriaDividaFixa, string> = {
  fixa: "bg-gray-100 text-gray-700",
  assinatura: "bg-blue-100 text-blue-700",
  divida_pessoa: "bg-purple-100 text-purple-700",
};

export function CategoriaPill({ categoria }: { categoria: CategoriaDividaFixa }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${CORES_CATEGORIA[categoria]}`}
    >
      {ROTULOS_CATEGORIA[categoria]}
    </span>
  );
}

/** <select> nativo com as 3 categorias — pra usar dentro de qualquer form. */
export function SeletorCategoriaDividaFixa({
  defaultValue = "fixa",
}: {
  defaultValue?: CategoriaDividaFixa;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      Categoria
      <select
        name="categoria"
        defaultValue={defaultValue}
        className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-verde-500 focus:ring-2 focus:ring-verde-100"
      >
        <option value="fixa">Fixa essencial (não dá pra cortar)</option>
        <option value="assinatura">Assinatura (dá pra cortar se precisar)</option>
        <option value="divida_pessoa">Dívida com pessoa (devo a alguém, não é um compromisso fixo)</option>
      </select>
    </label>
  );
}
