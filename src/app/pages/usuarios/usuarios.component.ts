import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { UserProfile, UserRole, ROLE_LABELS, ROLE_CSS, ALL_ROLES } from '../../models/user.model';
import { EmptyStateComponent } from '../../components/empty-state.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule,
    EmptyStateComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {

  private usuarioService = inject(UsuarioService);
  private authService    = inject(AuthService);
  private toast          = inject(ToastService);
  private router         = inject(Router);

  readonly ROLE_LABELS = ROLE_LABELS;
  readonly ROLE_CSS    = ROLE_CSS;
  readonly ALL_ROLES   = ALL_ROLES;

  usuarios: UserProfile[]         = [];
  filtrados: UserProfile[]        = [];
  carregando                      = true;

  searchTerm  = '';
  filterRole  = '';
  filterAtivo = '';

  showForm    = false;
  salvando    = false;
  deletandoId: number | null = null;

  form = { nome: '', email: '', senha: '', roleNome: 'ROLE_TECNICO' };

  meuId      = this.authService.getUserId();
  minhaRole  = this.authService.getRole();
  isSuperAdmin = this.authService.hasRole('ROLE_SUPER_ADMIN');

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.carregando = true;
    this.usuarioService.listar().subscribe({
      next: u => { this.usuarios = u; this.applyFilter(); this.carregando = false; },
      error: () => { this.toast.show('Erro ao carregar usuários', 'error'); this.carregando = false; }
    });
  }

  applyFilter() {
    this.filtrados = this.usuarios.filter(u => {
      const matchText = !this.searchTerm ||
        u.nome.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchRole  = !this.filterRole  || u.role === this.filterRole;
      const matchAtivo = !this.filterAtivo || String(u.ativo) === this.filterAtivo;
      return matchText && matchRole && matchAtivo;
    });
  }

  novoConvite() {
    this.form = { nome: '', email: '', senha: '', roleNome: 'ROLE_TECNICO' };
    this.showForm = true;
  }

  cancelar() { this.showForm = false; }

  salvar() {
    if (!this.form.nome || !this.form.email || !this.form.senha) {
      this.toast.show('Preencha todos os campos', 'error'); return;
    }
    this.salvando = true;
    this.usuarioService.convidar(this.form).subscribe({
      next: u => {
        this.usuarios.unshift(u);
        this.applyFilter();
        this.showForm = false;
        this.salvando = false;
        this.toast.show('Usuário criado com sucesso', 'success');
      },
      error: err => {
        const msg = err.status === 409 ? 'Email já cadastrado' : 'Erro ao criar usuário';
        this.toast.show(msg, 'error');
        this.salvando = false;
      }
    });
  }

  alterarRole(usuario: UserProfile, novaRole: string) {
    if (!novaRole || novaRole === usuario.role) return;
    this.usuarioService.alterarRole(usuario.id, novaRole).subscribe({
      next: u => {
        this.patchUsuario(u);
        this.toast.show('Role alterada', 'success');
      },
      error: err => {
        const msg = err.status === 403 ? 'Sem permissão para esta operação' : 'Erro ao alterar role';
        this.toast.show(msg, 'error');
        this.carregar();
      }
    });
  }

  toggleAtivo(usuario: UserProfile) {
    const op = usuario.ativo
      ? this.usuarioService.desativar(usuario.id)
      : this.usuarioService.ativar(usuario.id);

    op.subscribe({
      next: u => {
        this.patchUsuario(u);
        this.toast.show(u.ativo ? 'Usuário ativado' : 'Usuário desativado', 'success');
      },
      error: err => {
        const msg = err.status === 403 ? 'Sem permissão' : 'Erro ao alterar status';
        this.toast.show(msg, 'error');
      }
    });
  }

  confirmarDelete(id: number) { this.deletandoId = id; }
  cancelarDelete()            { this.deletandoId = null; }

  deletar(id: number) {
    this.usuarioService.deletar(id).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(u => u.id !== id);
        this.applyFilter();
        this.deletandoId = null;
        this.toast.show('Usuário removido', 'success');
      },
      error: () => this.toast.show('Erro ao remover usuário', 'error')
    });
  }

  podeGerenciar(usuario: UserProfile): boolean {
    if (usuario.id === this.meuId) return false;
    if (this.isSuperAdmin) return true;
    return usuario.role !== 'ROLE_SUPER_ADMIN' && usuario.role !== 'ROLE_ADMIN';
  }

  rolesDisponiveisParaOp(): UserRole[] {
    if (this.isSuperAdmin) return ALL_ROLES;
    return ALL_ROLES.filter(r => r !== 'ROLE_SUPER_ADMIN' && r !== 'ROLE_ADMIN');
  }

  iniciais(nome: string): string {
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  voltar() { this.router.navigate(['/dashboard']); }

  trackById(_: number, u: UserProfile) { return u.id; }

  private patchUsuario(updated: UserProfile) {
    const idx = this.usuarios.findIndex(u => u.id === updated.id);
    if (idx >= 0) this.usuarios[idx] = updated;
    this.applyFilter();
  }
}
