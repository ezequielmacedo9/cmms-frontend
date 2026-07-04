export interface PecaConsumida {
  pecaId: number;
  pecaNome?: string;
  quantidade: number;
  custoUnitario?: number;
  subtotal?: number;
}

export interface ChecklistItem {
  id: number;
  descricao: string;
  concluido: boolean;
}

export interface AnexoMeta {
  id: number;
  nome: string;
  contentType?: string;
  tamanho?: number;
}

export interface AnexoDownload {
  id: number;
  nome: string;
  contentType?: string;
  dadosBase64: string;
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
  checklist?: ChecklistItem[];
  anexos?: AnexoMeta[];
  maquina?: { id: number; nome: string; setor?: string };
}
