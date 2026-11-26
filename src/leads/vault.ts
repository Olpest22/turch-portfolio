import CFG from './gate.json';

/* Password gate for the private pages. GitHub Pages is static, so the check runs in the browser:
   PBKDF2(password) gives 512 bits — the first half is the AES-GCM key that encrypts the lead base
   on this device, the second half is compared with `check` in gate.json. Knowing `check` does not
   reveal the key, and without the password the stored data can't be read.
   Change the password with:  npm run set-password  */

const te = new TextEncoder();
const td = new TextDecoder();
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hex = (u: Uint8Array) => [...u].map((x) => x.toString(16).padStart(2, '0')).join('');

export const normalize = (pw: string) => pw.normalize('NFKC').trim().toLowerCase();

/** Returns the data key, or null for a wrong password. */
export async function unlock(pw: string): Promise<CryptoKey | null> {
  const base = await crypto.subtle.importKey('raw', te.encode(normalize(pw)), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(CFG.salt), iterations: CFG.iterations }, base, 512),
  );
  if (hex(bits.slice(32)) !== CFG.check) return null;
  return crypto.subtle.importKey('raw', bits.slice(0, 32), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function seal(key: CryptoKey, text: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(text)));
  const out = new Uint8Array(12 + ct.length);
  out.set(iv);
  out.set(ct, 12);
  return b64(out);
}
export async function open(key: CryptoKey, blob: string) {
  const u = unb64(blob);
  return td.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(0, 12) }, key, u.slice(12)));
}

/* «Remember on this device»: the key is kept in IndexedDB as a non-extractable CryptoKey,
   so even this page can't read its bytes back out. «Выйти» deletes it. */
const DB = 'turch-vault';
const idb = () =>
  new Promise<IDBDatabase>((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('k');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await idb();
  return new Promise<T>((res, rej) => {
    const r = fn(db.transaction('k', mode).objectStore('k'));
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }).finally(() => db.close());
}
// the stored key is tied to the current password: a new password (new `check`) logs everyone out
export const rememberKey = (k: CryptoKey) => tx('readwrite', (s) => s.put({ k, check: CFG.check }, 'key')).catch(() => undefined);
export const forgetKey = () => tx('readwrite', (s) => s.delete('key')).catch(() => undefined);
export async function recallKey(): Promise<CryptoKey | null> {
  try {
    const v = (await tx('readonly', (s) => s.get('key'))) as { k: CryptoKey; check: string } | undefined;
    return v && v.check === CFG.check ? v.k : null;
  } catch {
    return null;
  }
}
