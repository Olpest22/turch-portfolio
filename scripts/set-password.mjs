// Sets the password for /leads/.  Usage:  npm run set-password            (generates a random one)
//                                         npm run set-password -- "мой пароль"
// Only a salt and a check value are written to src/leads/gate.json; the password itself is not stored.
// Before changing it, download a CSV in the tracker: data saved under the old password can't be opened with a new one.
import { pbkdf2Sync, randomBytes, randomInt } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const ABC = 'abcdefghjkmnpqrstuvwxyz23456789';
const gen = () => Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => ABC[randomInt(ABC.length)]).join('')).join('-');

const pw = (process.argv[2] ?? gen()).normalize('NFKC').trim().toLowerCase();
if (pw.length < 10) {
  console.error('Пароль должен быть не короче 10 символов.');
  process.exit(1);
}
const iterations = 600_000;
const salt = randomBytes(16);
const bits = pbkdf2Sync(pw, salt, iterations, 64, 'sha256');
const cfg = { salt: salt.toString('base64'), iterations, check: bits.subarray(32).toString('hex') };
writeFileSync(new URL('../src/leads/gate.json', import.meta.url), JSON.stringify(cfg, null, 2) + '\n');
console.log(`Пароль: ${pw}`);
