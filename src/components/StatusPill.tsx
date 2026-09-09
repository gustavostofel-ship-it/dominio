import type { StatusFinanceiro } from "@/lib/calc";

const ROTULOS: Record<StatusFinanceiro, string> = {
  verde: "Sob controle",
  amarelo: "Atenção",
  vermelho: "Alerta",
};

export function StatusPill({ status }: { status: StatusFinanceiro }) {
  return <span className={`status-pill status-pill--${status}`}>● {ROTULOS[status]}</span>;
}
