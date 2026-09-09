import type { StatusFinanceiro } from "@/lib/calc";

const CORES: Record<StatusFinanceiro, string> = {
  verde: "var(--color-verde-500)",
  amarelo: "var(--color-amarelo-600)",
  vermelho: "var(--color-vermelho-600)",
};

function pontoNoArco(cx: number, cy: number, r: number, anguloGraus: number) {
  const rad = (anguloGraus * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function arcoPath(cx: number, cy: number, r: number, anguloInicial: number, anguloFinal: number) {
  const p1 = pontoNoArco(cx, cy, r, anguloInicial);
  const p2 = pontoNoArco(cx, cy, r, anguloFinal);
  const largeArc = anguloInicial - anguloFinal > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y}`;
}

/**
 * Medidor semicircular mostrando quanto da renda esperada já está
 * comprometido com dívidas pendentes no mês, colorido pelo status
 * verde/amarelo/vermelho.
 */
export function StatusGauge({
  percentual,
  status,
  rotulo,
}: {
  percentual: number;
  status: StatusFinanceiro;
  rotulo: string;
}) {
  const fracao = Math.min(1, Math.max(0, percentual / 100));
  const cx = 100;
  const cy = 100;
  const r = 80;

  const fundo = arcoPath(cx, cy, r, 180, 0);
  const frente = arcoPath(cx, cy, r, 180, 180 - 180 * fracao);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="10 10 180 100" className="w-48">
        <path d={fundo} fill="none" stroke="var(--color-verde-100)" strokeWidth="16" strokeLinecap="round" />
        {fracao > 0 && (
          <path d={frente} fill="none" stroke={CORES[status]} strokeWidth="16" strokeLinecap="round" />
        )}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--foreground)">
          {Math.round(percentual)}%
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="var(--foreground-muted)">
          da renda esperada
        </text>
      </svg>
      <p className="-mt-2 text-xs font-medium text-foreground-muted">{rotulo}</p>
    </div>
  );
}
