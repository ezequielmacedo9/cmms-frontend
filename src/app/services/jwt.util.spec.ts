import { decodeJwt, isTokenExpired } from './jwt.util';

/**
 * Helper that builds a minimal-but-valid JWT (header.payload.signature)
 * so we can exercise decodeJwt without pulling a signing library.
 * The signature segment is not validated by the util.
 */
function makeToken(payload: object): string {
  const header  = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body    = base64UrlEncode(JSON.stringify(payload));
  // Arbitrary 'signature' segment — decodeJwt ignores it on purpose.
  return `${header}.${body}.signature`;
}

function base64UrlEncode(s: string): string {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('jwt.util', () => {

  describe('decodeJwt', () => {
    it('retorna null para null/undefined/empty', () => {
      expect(decodeJwt(null)).toBeNull();
      expect(decodeJwt(undefined)).toBeNull();
      expect(decodeJwt('')).toBeNull();
    });

    it('retorna null para string sem ponto', () => {
      expect(decodeJwt('not-a-jwt')).toBeNull();
    });

    it('decodifica payload com sub, role e exp', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token = makeToken({ sub: 'user@cmms.app', role: 'ROLE_ADMIN', exp });

      const claims = decodeJwt(token);

      expect(claims).not.toBeNull();
      expect(claims!.sub).toBe('user@cmms.app');
      expect(claims!.role).toBe('ROLE_ADMIN');
      expect(claims!.exp).toBe(exp);
    });

    it('lida com payloads que precisam de padding base64url', () => {
      // Payload curto força padding diferente — testa o '=== slice'.
      const token = makeToken({ a: 1 });
      const claims = decodeJwt(token);
      expect(claims).not.toBeNull();
      expect((claims as any).a).toBe(1);
    });

    it('retorna null para payload base64 inválido', () => {
      expect(decodeJwt('xxx.@@@invalid@@@.yyy')).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('retorna true para token nulo ou em branco', () => {
      expect(isTokenExpired(null)).toBe(true);
      expect(isTokenExpired(undefined)).toBe(true);
      expect(isTokenExpired('')).toBe(true);
    });

    it('retorna true quando exp está ausente', () => {
      const token = makeToken({ sub: 'x' });
      expect(isTokenExpired(token)).toBe(true);
    });

    it('retorna true para token com exp no passado', () => {
      const past = Math.floor(Date.now() / 1000) - 60;
      expect(isTokenExpired(makeToken({ exp: past }))).toBe(true);
    });

    it('retorna false para token com exp confortavelmente no futuro', () => {
      const future = Math.floor(Date.now() / 1000) + 3600;
      expect(isTokenExpired(makeToken({ exp: future }))).toBe(false);
    });

    it('considera o skew configurável — exp 3s futuro com skew=5 é "expirado"', () => {
      const almostNow = Math.floor(Date.now() / 1000) + 3;
      expect(isTokenExpired(makeToken({ exp: almostNow }), 5)).toBe(true);
    });
  });
});
