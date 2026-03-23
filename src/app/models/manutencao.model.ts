export interface Manutencao {
  id?: number;
  tipo: string;
  descricao?: string;
  tecnico: string;
  dataManutencao?: string;
  maquina?: { id: number; nome: string };
}
