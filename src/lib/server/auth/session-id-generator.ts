import { randomBytes } from 'crypto';

export interface SessionIdGenerator {
  generate(): string;
}

export class CryptoSessionIdGenerator implements SessionIdGenerator {
  constructor(private readonly byteLength = 32) {}

  generate(): string {
    return randomBytes(this.byteLength).toString('hex');
  }
}
