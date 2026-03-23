export interface Maquina {
    id?: number;
    nome: string;
    setor: string
    status: string;
    dataUltimaManutencao?: string;
    intervaloPreventivaDias?: number;
}