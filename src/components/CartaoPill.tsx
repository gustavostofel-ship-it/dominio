// Paleta fixa (mesmo esquema visual da CategoriaPill) — a cor de cada
// cartão é escolhida por hash do id, então o mesmo cartão sempre aparece
// com a mesma cor em qualquer lugar do sistema, sem precisar guardar isso
// no banco.
const PALETA_CARTAO = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
  "bg-lime-100 text-lime-700",
  "bg-cyan-100 text-cyan-700",
];

function corParaCartao(chave: string): string {
  let hash = 0;
  for (let i = 0; i < chave.length; i++) hash = (hash * 31 + chave.charCodeAt(i)) >>> 0;
  return PALETA_CARTAO[hash % PALETA_CARTAO.length];
}

/** Pill colorida com o nome do cartão — mesmo destaque visual da CategoriaPill, pra achar rápido no histórico qual fatura é qual. */
export function CartaoPill({ nome, cartaoId }: { nome: string; cartaoId: string | null }) {
  const cor = cartaoId ? corParaCartao(cartaoId) : "bg-gray-100 text-gray-500";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cor}`}>
      {nome}
    </span>
  );
}
