import { Injectable } from "@nestjs/common";
import { argon2id, hash, needsRehash, verify } from "argon2";
import type { PasswordHasher } from "../../application/ports";

const OPTIONS = {
  type: argon2id,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1
} as const;

const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQxMjM0NTY3OA$jd2HxKZK85pCu0NfEs5kO0yUijHezPSHj2AMrvYQwCA";

@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return hash(password, OPTIONS);
  }

  verify(encodedHash: string, password: string): Promise<boolean> {
    return verify(encodedHash, password);
  }

  needsRehash(encodedHash: string): boolean {
    return needsRehash(encodedHash, OPTIONS);
  }

  async dummyVerify(password: string): Promise<void> {
    await verify(DUMMY_HASH, password).catch(() => false);
  }
}
