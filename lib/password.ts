/**
 * bcrypt work factor for new/rotated passwords.
 *
 * bcryptjs is a pure-JS implementation (no native binding), so cost 12
 * measures ~450-700ms per hash/compare on typical hardware — that alone
 * was the dominant chunk of login latency. Cost 10 is bcrypt's historical
 * default and still well within OWASP's recommended range, at roughly a
 * sixth of the cost (~100ms).
 *
 * Existing hashes keep whichever cost they were created with (it's encoded
 * in the hash string itself) — see `getBcryptCost` and the rehash-on-login
 * logic in `lib/auth.ts`, which transparently migrates a user's hash to
 * this cost the next time they log in successfully.
 */
export const BCRYPT_COST = 10;

/** Extracts the work factor encoded in a bcrypt hash, e.g. "$2b$12$..." -> 12. */
export function getBcryptCost(hash: string): number | null {
  const match = /^\$2[aby]?\$(\d{2})\$/.exec(hash);
  return match ? parseInt(match[1], 10) : null;
}
