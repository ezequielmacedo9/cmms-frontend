import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProfileService, UserProfileFull } from '../../services/profile.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

type Tab = 'perfil' | 'seguranca' | '2fa';

import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private profileSvc  = inject(ProfileService);
  private notify      = inject(NotificationService);
  private auth        = inject(AuthService);

  activeTab: Tab = 'perfil';
  loading = true;
  saving  = signal(false);

  profile: UserProfileFull = {} as UserProfileFull;

  // Profile tab
  nome = ''; telefone = ''; cargo = ''; departamento = '';

  // Security tab
  senhaAtual = ''; novaSenha = ''; confirmarSenha = '';
  showSenhaAtual = false; showNovaSenha = false;
  savingPassword = false;

  // 2FA tab
  totpStep: 'idle' | 'setup' | 'done' = 'idle';
  totpQrCode = ''; totpSecret = ''; totpCode = '';
  verifying2fa = false;
  disabling2fa = false; senhaParaDesativar = '';

  // Avatar
  avatarPreview = '';
  uploadingAvatar = false;

  ngOnInit() {
    this.profileSvc.get().subscribe({
      next: p => {
        this.profile = p;
        this.nome = p.nome; this.telefone = p.telefone;
        this.cargo = p.cargo; this.departamento = p.departamento;
        this.avatarPreview = p.avatarBase64 || '';
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  setTab(t: Tab) { this.activeTab = t; }

  get initial(): string {
    return (this.profile.nome || this.profile.email || '?').charAt(0).toUpperCase();
  }

  // ── Profile ────────────────────────────────────────────────────────────

  saveProfile() {
    this.saving.set(true);
    this.profileSvc.update({ nome: this.nome, telefone: this.telefone, cargo: this.cargo, departamento: this.departamento }).subscribe({
      next: p => {
        this.profile = p;
        this.notify.success('Perfil atualizado com sucesso');
        // Update name in storage
        localStorage.setItem('userNome', p.nome);
        this.saving.set(false);
      },
      error: () => { this.notify.error('Erro ao salvar perfil'); this.saving.set(false); }
    });
  }

  onAvatarChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 300_000) { this.notify.warning('Imagem muito grande (máx 300KB)'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.uploadingAvatar = true;
      this.profileSvc.uploadAvatar(base64).subscribe({
        next: r => { this.avatarPreview = r.avatarBase64; this.uploadingAvatar = false; this.notify.success('Foto atualizada'); },
        error: () => { this.uploadingAvatar = false; this.notify.error('Erro ao fazer upload'); }
      });
    };
    reader.readAsDataURL(file);
  }

  // ── Password ───────────────────────────────────────────────────────────

  savePassword() {
    if (this.novaSenha !== this.confirmarSenha) { this.notify.warning('As senhas não coincidem'); return; }
    if (this.novaSenha.length < 8) { this.notify.warning('A nova senha deve ter pelo menos 8 caracteres'); return; }
    this.savingPassword = true;
    this.profileSvc.changePassword(this.senhaAtual, this.novaSenha).subscribe({
      next: () => {
        this.notify.success('Senha alterada com sucesso');
        this.senhaAtual = this.novaSenha = this.confirmarSenha = '';
        this.savingPassword = false;
      },
      error: (e: any) => {
        this.notify.error(e?.error?.error || 'Erro ao alterar senha');
        this.savingPassword = false;
      }
    });
  }

  // ── 2FA ────────────────────────────────────────────────────────────────

  start2faSetup() {
    this.profileSvc.setup2fa().subscribe({
      next: r => { this.totpQrCode = r.qrCodeDataUri; this.totpSecret = r.manualEntryKey; this.totpStep = 'setup'; },
      error: () => this.notify.error('Erro ao iniciar configuração 2FA')
    });
  }

  verify2fa() {
    if (!this.totpCode || this.totpCode.length !== 6) { this.notify.warning('Insira o código de 6 dígitos'); return; }
    this.verifying2fa = true;
    this.profileSvc.verify2fa(this.totpCode).subscribe({
      next: () => {
        this.profile.totpEnabled = true;
        this.totpStep = 'done';
        this.verifying2fa = false;
        this.notify.success('2FA ativado com sucesso!');
      },
      error: (e: any) => { this.notify.error(e?.error?.error || 'Código inválido'); this.verifying2fa = false; }
    });
  }

  disable2fa() {
    if (!this.senhaParaDesativar) { this.notify.warning('Informe sua senha para confirmar'); return; }
    this.disabling2fa = true;
    this.profileSvc.disable2fa(this.senhaParaDesativar).subscribe({
      next: () => {
        this.profile.totpEnabled = false;
        this.totpStep = 'idle';
        this.senhaParaDesativar = '';
        this.disabling2fa = false;
        this.notify.success('2FA desativado');
      },
      error: (e: any) => { this.notify.error(e?.error?.error || 'Senha incorreta'); this.disabling2fa = false; }
    });
  }

  copySecret() {
    navigator.clipboard.writeText(this.totpSecret).then(() => this.notify.info('Chave copiada!'));
  }
}
