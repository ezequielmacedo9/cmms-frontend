import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type StatusAssinatura = 'TRIAL' | 'ATIVA' | 'INADIMPLENTE' | 'CANCELADA';
export type PlanoAssinatura  = 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';

export interface AssinaturaInfo {
  id: number;
  plano: PlanoAssinatura;
  valorMensal: number;
  status: StatusAssinatura;
  dataInicio: string;
  dataProximaCobranca: string;
  diasTrial: number;
  trialAtivo: boolean;
  acesso: boolean;
}

export interface PlanoInfo {
  nome: PlanoAssinatura;
  limiteAtivos: number | string;
  limiteUsuarios: number | string;
  valorMensal: number;
}

export interface CheckoutResult {
  assinatura: AssinaturaInfo;
  linkPagamento: string;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/billing`;

  listarPlanos(): Observable<Record<PlanoAssinatura, PlanoInfo>> {
    return this.http.get<Record<PlanoAssinatura, PlanoInfo>>(`${this.base}/planos`);
  }

  getMinhaAssinatura(): Observable<AssinaturaInfo> {
    return this.http.get<AssinaturaInfo>(`${this.base}/minha`);
  }

  checkout(plano: PlanoAssinatura): Observable<CheckoutResult> {
    return this.http.post<CheckoutResult>(`${this.base}/checkout`, { plano });
  }

  upgrade(plano: PlanoAssinatura): Observable<AssinaturaInfo> {
    return this.http.put<AssinaturaInfo>(`${this.base}/upgrade`, { plano });
  }

  cancelar(): Observable<void> {
    return this.http.post<void>(`${this.base}/cancelar`, {});
  }
}
