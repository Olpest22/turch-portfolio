// Sets the password for /leads/ and (re)creates the lead-radar key pair.
//   npm run set-password                    new random password
//   npm run set-password -- "мой пароль"    this password
// If the given password is the current one, salt and check stay the same, so saved data on devices keeps opening;
// only the radar keys are created. Only a salt, a check value and the radar private key encrypted with the
// password-derived key are written to src/leads/gate.json; the password itself is not stored anywhere.
// Before changing the password, download a CSV in the tracker: data saved under the old password can't be opened with a new one.
import { createCipheriv, generateKeyPairSync, pbkdf2Sync, randomBytes, randomInt } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const GATE = new URL('../src/leads/gate.json', import.meta.url);
const PUB = new URL('../ops/threads/radar/public.pem', import.meta.url);
const ABC = 'abcdefghjkmnpqrstuvwxyz23456789';
const gen = () => Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => ABC[randomInt(ABC.length)]).join('')).join('-');

const given = process.argv[2];
const pw = (given ?? gen()).normalize('NFKC').trim().toLowerCase();
if (pw.length < 10) {
  console.error('Пароль должен быть не короче 10 символов.');
  process.exit(1);
}

const iterations = 600_000;
let salt = randomBytes(16);
let kept = false;
if (given && existsSync(GATE)) {
  const old = JSON.parse(readFileSync(GATE, 'utf8'));
  const bits = pbkdf2Sync(pw, Buffer.from(old.salt, 'base64'), old.iterations, 64, 'sha256');
  if (bits.subarray(32).toString('hex') === old.check) {
    salt = Buffer.from(old.salt, 'base64');
    kept = true;
  }
}
const bits = pbkdf2Sync(pw, salt, iterations, 64, 'sha256');
const key = bits.subarray(0, 32);

// radar keys: the radar encrypts with the public key, /leads/ decrypts with the private one after login
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 3072 });
const pkcs8 = privateKey.export({ type: 'pkcs8', format: 'der' });
const iv = randomBytes(12);
const c = createCipheriv('aes-256-gcm', key, iv);
const sealed = Buffer.concat([iv, c.update(pkcs8), c.final(), c.getAuthTag()]); // same layout as vault.ts seal()

const cfg = { salt: salt.toString('base64'), iterations, check: bits.subarray(32).toString('hex'), radar: sealed.toString('base64') };
writeFileSync(GATE, JSON.stringify(cfg, null, 2) + '\n');
writeFileSync(PUB, publicKey.export({ type: 'spki', format: 'pem' }));
console.log(kept ? 'Пароль прежний, созданы новые ключи радара.' : `Пароль: ${pw}`);
