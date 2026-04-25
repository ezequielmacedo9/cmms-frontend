export interface Maquina {
  id?: number;
  nome: string;
  setor: string;
  status: string;
  prioridade?: string;
  dataUltimaManutencao?: string;
  intervaloPreventivaDias?: number;
  manutencaoVencida?: boolean;
}
