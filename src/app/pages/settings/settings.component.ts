import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ConfigItem, SettingsService } from '../../services/settings.service';
import { NotificationService } from '../../services/notification.service';
import { TranslatePipe } from '../../i18n/translate.pipe';

type Tab = 'geral' | 'seguranca' | 'notificacoes';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslatePipe],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  private svc    = inject(SettingsService);
  private notify = inject(NotificationService);

  activeTab: Tab = 'geral';
  loading = true;
  saving = false;
  configs: ConfigItem[] = [];
  values: Record<string, string> = {};

  ngOnInit() {
    this.svc.list().subscribe({
      next: items => {
        this.configs = items;
        items.forEach(i => this.values[i.chave] = i.valor);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  get(chave: string): string { return this.values[chave] ?? ''; }
  set(chave: string, value: string) { this.values[chave] = value; }

  setTab(t: Tab) { this.activeTab = t; }

  save() {
    this.saving = true;
    this.svc.save(this.values).subscribe({
      next: () => { this.notify.success('Configurações salvas com sucesso'); this.saving = false; },
      error: () => { this.notify.error('Erro ao salvar configurações'); this.saving = false; }
    });
  }

  groupConfigs(grupo: string): ConfigItem[] {
    return this.configs.filter(c => c.grupo === grupo);
  }
}
