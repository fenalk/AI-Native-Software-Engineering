import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const SALT_BYTES = 16;
const HASH_BYTES = 64;
const ALGORITHM = 'scrypt';

/**
 * Hashes passwords with `scrypt` from `node:crypto`, so there is no native
 * dependency to build. Stored form: `scrypt$<saltHex>$<hashHex>`.
 */
@Injectable()
export class PasswordHasherService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const hash = await scryptAsync(password, salt, HASH_BYTES);
    return `${ALGORITHM}$${salt.toString('hex')}$${hash.toString('hex')}`;
  }

  async verify(password: string, stored: string): Promise<boolean> {
    const [algorithm, saltHex, hashHex] = stored.split('$');
    if (algorithm !== ALGORITHM || !saltHex || !hashHex) {
      return false;
    }

    const expected = Buffer.from(hashHex, 'hex');
    const actual = await scryptAsync(
      password,
      Buffer.from(saltHex, 'hex'),
      expected.length,
    );
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }
}
