import { randomBytes, pbkdf2 } from 'crypto';
import { promisify } from 'util';

const pbkdf2Async = promisify(pbkdf2);

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, stored: string): Promise<boolean>;
}

export interface PasswordHasherConfig {
  iterations: number;
  keyLength: number;
  digest: string;
  saltLength: number;
}

export const defaultPasswordHasherConfig: PasswordHasherConfig = {
  iterations: 100_000,
  keyLength: 64,
  digest: 'sha256',
  saltLength: 32
};

export class PBKDF2PasswordHasher implements PasswordHasher {
  constructor(private readonly config: PasswordHasherConfig = defaultPasswordHasherConfig) {}

  async hash(password: string): Promise<string> {
    const salt = randomBytes(this.config.saltLength).toString('hex');
    const hashBuffer = await pbkdf2Async(
      password,
      salt,
      this.config.iterations,
      this.config.keyLength,
      this.config.digest
    );
    return `${salt}:${hashBuffer.toString('hex')}`;
  }

  async verify(password: string, stored: string): Promise<boolean> {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) {
      return false;
    }

    const derived = await pbkdf2Async(
      password,
      salt,
      this.config.iterations,
      this.config.keyLength,
      this.config.digest
    );

    return hash === derived.toString('hex');
  }
}
