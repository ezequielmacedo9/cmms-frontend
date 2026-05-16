import { UserRole } from './user.model';

/** Response payload of `/api/auth/login`, `/refresh` and `/google`. */
export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  role: UserRole;
  nome: string;
  userId: number;
  email?: string;
}
