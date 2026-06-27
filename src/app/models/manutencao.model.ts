export interface PecaConsumida {
  pecaId: number;
  pecaNome?: string;
  quantidade: number;
  custoUnitario?: number;
  subtotal?: number;
}

export interface Manutencao {
  id?: number;
  tipo: string;
  descricao?: string;
  tecnico: string;
  tecnicoId?: number;
  prioridade?: string;
  status?: string;
  dataManutencao?: string;
  dataAbertura?: string;
  dataConclusao?: string;
  tempoExecucaoMinutos?: number;
  custoMaoObra?: number;
  custoPecas?: number;
  custoTotal?: number;
  pecas?: PecaConsumida[];
  maquina?: { id: number; nome: string; setor?: string };
}
