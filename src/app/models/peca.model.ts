export interface PecaRequest {
  nome: string;
  codigo: string;
  quantidadeEmEstoque: number;
  custoUnitario: number;
  vidaUtilHoras: number;
}

export interface PecaResponse {
  id?: number;
  nome: string;
  codigo: string;
  quantidadeEmEstoque: number;
  custoUnitario: number;
  vidaUtilHoras: number;
}