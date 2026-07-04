import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmDialogService } from '../../components/confirm-dialog/confirm-dialog.service';
import { TableState } from '../../services/table-state';
import { UserProfile, UserRole, ROLE_LABELS, ROLE_CSS, ALL_ROLES } from '../../models/user.model';
import { EmptyStateComponent } from '../../components/empty-state.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule,
    EmptyStateComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {

  private usuarioService = inject(UsuarioService);
  private authService    = inject(AuthService);
  private toast          = inject(ToastService);
  private confirm        = inject(ConfirmDialogService);
  private router         = inject(Router);
  private fb             = inject(NonNullableFormBuilder);

  readonly ROLE_LABELS = ROLE_LABELS;
  readonly ROLE_CSS    = ROLE_CSS;
  readonly ALL_ROLES   = ALL_ROLES;

  /** Source list straight from the API — the dropdowns narrow this. */
  usuarios: UserProfile[] = [];
  carregando              = true;

  /** Live search + sort (full list — no pagination on this page). */
  readonly table = new TableState<UserProfile>(
    u => [u.nome, u.email],
    { column: 'nome', direction: 'asc' }
  );

  searchTerm  = '';
  filterRole  = '';
  filterAtivo = '';

  showForm    = false;
  salvando    = false;

  /** Reactive invite form with inline validation. */
  readonly inviteForm = this.fb.group({
    nome:     ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email:    ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    senha:    ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    roleNome: ['ROLE_TECNICO']
  });

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

  /** Re-feeds the table with the role/status-filtered slice (search stays applied). */
  applyFilter() {
    let rows = this.usuarios;
    if (this.filterRole)  rows = rows.filter(u => u.role === this.filterRole);
    if (this.filterAtivo) rows = rows.filter(u => String(u.ativo) === this.filterAtivo);
    this.table.setData(rows);
  }

  onSearch() { this.table.setSearch(this.searchTerm); }
  onSort(column: string) { this.table.toggleSort(column); }
  sortDir(column: string) { return this.table.directionOf(column); }

  novoConvite() {
    this.inviteForm.reset({ nome: '', email: '', senha: '', roleNome: 'ROLE_TECNICO' });
    this.showForm = true;
  }

  cancelar() { this.showForm = false; }

  /** Convenience for the template's inline error hints. */
  campoInvalido(nome: 'nome' | 'email' | 'senha'): boolean {
    const c = this.inviteForm.controls[nome];
    return c.invalid && (c.touched || c.dirty);
  }

  salvar() {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      this.toast.show('Corrija os campos destacados', 'error');
      return;
    }
    this.salvando = true;
    const v = this.inviteForm.getRawValue();
    this.usuarioService.convidar({ ...v, nome: v.nome.trim(), email: v.email.trim() }).subscribe({
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

  async confirmarExclusao(usuario: UserProfile) {
    const ok = await this.confirm.ask({
      title: 'Remover usuário?',
      message: `"${usuario.nome}" será removido permanentemente. Esta ação não pode ser desfeita.`,
      variant: 'danger',
      confirmLabel: 'Remover'
    });
    if (ok) this.deletar(usuario.id);
  }

  private deletar(id: number) {
    this.usuarioService.deletar(id).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(u => u.id !== id);
        this.applyFilter();
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
