import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  BillingService,
  AssinaturaInfo,
  PlanoInfo,
  PlanoAssinatura,
  CheckoutResult
} from '../../services/billing.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.css'
})
export class BillingComponent implements OnInit {
  private svc    = inject(BillingService);
  private notify = inject(NotificationService);

  loading     = signal(true);
  actionBusy  = signal<PlanoAssinatura | null>(null);
  assinatura  = signal<AssinaturaInfo | null>(null);
  planos      = signal<PlanoInfo[]>([]);
  checkoutUrl = signal<string | null>(null);

  readonly planoOrder: PlanoAssinatura[] = ['STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE'];

  readonly planoIcons: Record<PlanoAssinatura, string> = {
    STARTER:    'rocket_launch',
    PRO:        'workspace_premium',
    BUSINESS:   'business',
    ENTERPRISE: 'diamond'
  };

  readonly planoDesc: Record<PlanoAssinatura, string> = {
    STARTER:    'Para pequenas equipes começando',
    PRO:        'Para equipes em crescimento',
    BUSINESS:   'Para operações consolidadas',
    ENTERPRISE: 'Capacidade ilimitada'
  };

  ngOnInit() {
    this.svc.listarPlanos().subscribe({
      next: planosMap => {
        const lista = this.planoOrder
          .filter(p => planosMap[p])
          .map(p => planosMap[p]);
        this.planos.set(lista);
      }
    });

    this.svc.getMinhaAssinatura().subscribe({
      next: a => { this.assinatura.set(a); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  get currentPlano(): PlanoAssinatura | null {
    return this.assinatura()?.plano ?? null;
  }

  get diasRestantes(): number {
    const a = this.assinatura();
    if (!a?.dataProximaCobranca) return 0;
    const diff = new Date(a.dataProximaCobranca).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  }

  checkout(plano: PlanoAssinatura) {
    this.actionBusy.set(plano);
    this.svc.checkout(plano).subscribe({
      next: (res: CheckoutResult) => {
        this.assinatura.set(res.assinatura);
        this.actionBusy.set(null);
        if (res.linkPagamento && res.linkPagamento.startsWith('http')) {
          this.checkoutUrl.set(res.linkPagamento);
          window.open(res.linkPagamento, '_blank');
        } else {
          this.notify.success('Assinatura registrada! Configure a chave Asaas para habilitar o checkout.');
        }
      },
      error: () => {
        this.notify.error('Erro ao iniciar checkout');
        this.actionBusy.set(null);
      }
    });
  }

  upgrade(plano: PlanoAssinatura) {
    this.actionBusy.set(plano);
    this.svc.upgrade(plano).subscribe({
      next: a => {
        this.assinatura.set(a);
        this.notify.success(`Plano atualizado para ${plano}`);
        this.actionBusy.set(null);
      },
      error: () => {
        this.notify.error('Erro ao atualizar plano');
        this.actionBusy.set(null);
      }
    });
  }

  cancelar() {
    if (!confirm('Tem certeza que deseja cancelar a assinatura?')) return;
    this.svc.cancelar().subscribe({
      next: () => {
        this.notify.success('Assinatura cancelada');
        this.ngOnInit();
      },
      error: () => this.notify.error('Erro ao cancelar assinatura')
    });
  }

  isCurrentPlano(plano: PlanoAssinatura): boolean {
    return this.assinatura()?.plano === plano;
  }

  isUpgrade(plano: PlanoAssinatura): boolean {
    const curr = this.planoOrder.indexOf(this.currentPlano ?? 'STARTER');
    return this.planoOrder.indexOf(plano) > curr;
  }

  statusLabel(s: AssinaturaInfo['status']): string {
    const labels: Record<string, string> = {
      TRIAL:       'Trial',
      ATIVA:       'Ativa',
      INADIMPLENTE:'Inadimplente',
      CANCELADA:   'Cancelada'
    };
    return labels[s] ?? s;
  }

  statusCss(s: AssinaturaInfo['status']): string {
    const map: Record<string, string> = {
      TRIAL:       'badge-trial',
      ATIVA:       'badge-ativa',
      INADIMPLENTE:'badge-inadimplente',
      CANCELADA:   'badge-cancelada'
    };
    return map[s] ?? '';
  }

  formatVal(v: number | string): string {
    if (typeof v === 'string') return v;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }
}
