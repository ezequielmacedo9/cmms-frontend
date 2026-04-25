export type UserRole =
  | 'ROLE_SUPER_ADMIN'
  | 'ROLE_ADMIN'
  | 'ROLE_GESTOR'
  | 'ROLE_TECNICO'
  | 'ROLE_VISUALIZADOR';

export interface UserProfile {
  id: number;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  dataCriacao?: string;
}

export const ROLE_LABELS: Record<string, string> = {
  'ROLE_SUPER_ADMIN':  'Super Admin',
  'ROLE_ADMIN':        'Administrador',
  'ROLE_GESTOR':       'Gestor',
  'ROLE_TECNICO':      'Técnico',
  'ROLE_VISUALIZADOR': 'Visualizador',
};

export const ROLE_CSS: Record<string, string> = {
  'ROLE_SUPER_ADMIN':  'role-superadmin',
  'ROLE_ADMIN':        'role-admin',
  'ROLE_GESTOR':       'role-gestor',
  'ROLE_TECNICO':      'role-tecnico',
  'ROLE_VISUALIZADOR': 'role-vis',
};

export const ALL_ROLES: UserRole[] = [
  'ROLE_SUPER_ADMIN',
  'ROLE_ADMIN',
  'ROLE_GESTOR',
  'ROLE_TECNICO',
  'ROLE_VISUALIZADOR',
];
