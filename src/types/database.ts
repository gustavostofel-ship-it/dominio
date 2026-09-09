/**
 * Tipos do banco de dados (escritos à mão a partir das migrations em
 * supabase/migrations). Se o schema mudar, atualize este arquivo junto.
 */

export type Papel = "owner" | "membro";
export type StatusItem = "pendente" | "pago_no_mes" | "quitado_antecipado";
export type StatusDivisao = "a_cobrar" | "recebido";

export interface ContaRow {
  id: string;
  nome: string;
  criado_em: string;
}

export interface UsuarioRow {
  id: string;
  conta_id: string;
  nome: string;
  email: string;
  papel: Papel;
  criado_em: string;
}

export interface CartaoRow {
  id: string;
  conta_id: string;
  nome: string;
  dia_fechamento: number;
  dia_vencimento: number;
  ativo: boolean;
  criado_por: string | null;
  criado_em: string;
  editado_por: string | null;
  editado_em: string | null;
}

export interface DividaFixaRow {
  id: string;
  conta_id: string;
  nome: string;
  valor_centavos: number;
  dia_vencimento: number;
  recorrente: boolean;
  mes_inicio: string; // date "YYYY-MM-DD"
  mes_fim: string | null;
  atribuido_a: string;
  ativo: boolean;
  criado_por: string | null;
  criado_em: string;
  editado_por: string | null;
  editado_em: string | null;
}

export interface CompraRow {
  id: string;
  conta_id: string;
  cartao_id: string;
  descricao: string;
  valor_total_centavos: number;
  numero_parcelas: number;
  mes_inicio: string;
  atribuido_a: string;
  criado_por: string | null;
  criado_em: string;
  editado_por: string | null;
  editado_em: string | null;
}

export interface ParcelaRow {
  id: string;
  conta_id: string;
  compra_id: string;
  numero_da_parcela: number;
  mes_referencia: string;
  valor_centavos: number;
  status: StatusItem;
  data_pagamento_real: string | null;
  criado_em: string;
}

export interface DividaFixaStatusRow {
  id: string;
  conta_id: string;
  divida_fixa_id: string;
  mes_referencia: string;
  status: StatusItem;
  data_pagamento_real: string | null;
  criado_em: string;
}

export interface DivisaoGastoRow {
  id: string;
  conta_id: string;
  compra_id: string;
  nome_da_pessoa: string;
  valor_centavos: number;
  status: StatusDivisao;
  mes_referencia: string;
  criado_em: string;
}

export interface ConfiguracoesRow {
  conta_id: string;
  renda_mensal_esperada_centavos: number;
  limite_uso_cartao_mes_centavos: number | null;
  faixa_verde_pct: number;
  faixa_amarela_pct: number;
  atualizado_em: string;
}
