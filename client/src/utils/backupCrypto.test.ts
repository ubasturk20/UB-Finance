import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  ENCRYPTED_BACKUP_FORMAT,
  InvalidEncryptedBackupError,
  WrongPasswordError,
  base64ToBytes,
  bytesToBase64,
  decryptBackup,
  encryptBackup,
  isEncryptedBackup,
} from './backupCrypto';

// The real files use 600,000 PBKDF2 iterations; a few keep the tests fast and change nothing
// else (the count is stored in the file and read back from it)
const FAST = 10;

describe('encrypted backups', () => {
  it('open again with the same password, exactly as they were', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), fc.string({ minLength: 1 }), async (json, password) => {
        const file = await encryptBackup(json, password, FAST);
        expect(isEncryptedBackup(file)).toBe(true);
        expect(await decryptBackup(file, password)).toBe(json);
      }),
      { numRuns: 30 },
    );
  });

  it('keep the backup unreadable and record how they were made', async () => {
    const json = JSON.stringify({ version: 3, data: { accounts: [{ name: 'Ziraat Vadesiz' }] } });
    const text = await encryptBackup(json, 'doğru parola', FAST);
    expect(text).not.toContain('Ziraat');
    const file = JSON.parse(text);
    expect(file).toMatchObject({
      format: ENCRYPTED_BACKUP_FORMAT,
      version: 1,
      kdf: 'PBKDF2-SHA256',
      iterations: FAST,
    });
    expect(base64ToBytes(file.salt)).toHaveLength(16);
    expect(base64ToBytes(file.iv)).toHaveLength(12);
    // A new salt and IV every time: the same backup never encrypts the same way twice
    const again = JSON.parse(await encryptBackup(json, 'doğru parola', FAST));
    expect(again.salt).not.toBe(file.salt);
    expect(again.iv).not.toBe(file.iv);
    expect(again.data).not.toBe(file.data);
  });

  it('use 600,000 iterations unless told otherwise', async () => {
    const file = JSON.parse(await encryptBackup('{}', 'parola123'));
    expect(file.iterations).toBe(600_000);
  });

  it('refuse a wrong password', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        async (password, other) => {
          fc.pre(password !== other);
          const file = await encryptBackup('{"version":3}', password, FAST);
          await expect(decryptBackup(file, other)).rejects.toBeInstanceOf(WrongPasswordError);
        },
      ),
      { numRuns: 20 },
    );
  });

  it('notice any changed byte of the data, salt or IV', async () => {
    const text = await encryptBackup('{"version":3,"data":{}}', 'parola123', FAST);
    const file = JSON.parse(text);
    for (const field of ['data', 'salt', 'iv'] as const) {
      const bytes = base64ToBytes(file[field]);
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: bytes.length - 1 }),
          fc.integer({ min: 1, max: 255 }),
          async (index, flip) => {
            const changed = bytes.slice();
            changed[index] ^= flip;
            const tampered = JSON.stringify({ ...file, [field]: bytesToBase64(changed) });
            await expect(decryptBackup(tampered, 'parola123')).rejects.toBeInstanceOf(
              WrongPasswordError,
            );
          },
        ),
        { numRuns: 10 },
      );
    }
  });

  it('tell other files apart from encrypted backups', async () => {
    for (const text of ['', 'not json', '{"version":3,"data":{}}', 'null', '[]']) {
      expect(isEncryptedBackup(text)).toBe(false);
      await expect(decryptBackup(text, 'x')).rejects.toBeInstanceOf(InvalidEncryptedBackupError);
    }
    const file = JSON.parse(await encryptBackup('{}', 'x', FAST));
    const broken = [
      { ...file, version: 2 },
      { ...file, kdf: 'scrypt' },
      { ...file, iterations: 0 },
      { ...file, iterations: 1e12 },
      { ...file, salt: 'AAAA' },
      { ...file, iv: '!!' },
      { ...file, data: undefined },
    ];
    for (const value of broken) {
      await expect(decryptBackup(JSON.stringify(value), 'x')).rejects.toBeInstanceOf(
        InvalidEncryptedBackupError,
      );
    }
  });

  it('write base64 that reads back to the same bytes', () => {
    fc.assert(
      fc.property(fc.uint8Array({ maxLength: 100_000 }), (bytes) => {
        expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
      }),
      { numRuns: 50 },
    );
  });
});
