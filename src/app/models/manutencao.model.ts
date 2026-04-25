export interface Manutencao {
  id?: number;
  tipo: string;
  descricao?: string;
  tecnico: string;
  prioridade?: string;
  status?: string;
  dataManutencao?: string;
  maquina?: { id: number; nome: string; setor?: string };
}
