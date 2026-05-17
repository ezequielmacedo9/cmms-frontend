/**
 * Tiny JWT helpers — decode-only, never validates the signature.
 *
 * <p>Signature validation belongs to the server. The frontend only needs
 * the {@code exp} claim to short-circuit obvious expirations before the
 * user clicks something that would round-trip and fail anyway.
 */

export interface JwtClaims {
  exp?: number;
  iat?: number;
  sub?: string;
  role?: string;
  [k: string]: unknown;
}

/** Decodes the payload of a JWT. Returns {@code null} when malformed. */
export function decodeJwt(token: string | null | undefined): JwtClaims | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    // Pad to a multiple of 4 — base64url doesn't include trailing '='.
    const padded = payload + '==='.slice((payload.length + 3) % 4);
    const json = atob(padded);
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

/**
 * Returns {@code true} when the token is missing, malformed or already
 * expired (with a small {@code skewSeconds} buffer so a click that races
 * the exp boundary still feels expired locally).
 */
export function isTokenExpired(token: string | null | undefined, skewSeconds = 5): boolean {
  const claims = decodeJwt(token);
  if (!claims?.exp) return true;
  const expMillis = claims.exp * 1000;
  return Date.now() >= (expMillis - skewSeconds * 1000);
}
