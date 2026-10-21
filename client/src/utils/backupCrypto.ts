// Password-protected backups, made and opened entirely in the browser: the server (and the
// demo's in-browser API) only ever sees the plain backup JSON it already sends and accepts.
// The password stretches into a key with PBKDF2-SHA256 (random 16-byte salt), which encrypts
// the backup with AES-256-GCM (random 12-byte IV). GCM authenticates the data, so a wrong
// password and a changed file are both detected rather than producing garbage.

export const ENCRYPTED_BACKUP_FORMAT = 'ub-finance-encrypted-backup';
export const ENCRYPTED_BACKUP_VERSION = 1;
/** OWASP's 2023 recommendation for PBKDF2-HMAC-SHA256 */
export const BACKUP_KDF_ITERATIONS = 600_000;
/** Shortest password the settings page accepts for a backup */
export const MIN_BACKUP_PASSWORD_LENGTH = 8;
/** File extension for encrypted backups */
export const ENCRYPTED_BACKUP_EXTENSION = '.ubfbackup';

const SALT_BYTES = 16;
const IV_BYTES = 12;
/** Opening a file asks for at most this many iterations, so a crafted file can't hang the tab */
const MAX_ITERATIONS = 10_000_000;

export interface EncryptedBackupFile {
  format: typeof ENCRYPTED_BACKUP_FORMAT;
  version: typeof ENCRYPTED_BACKUP_VERSION;
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string;
  iv: string;
  data: string;
}

/** The password is wrong, or the file was changed after it was made. */
export class WrongPasswordError extends Error {
  constructor() {
    super('Wrong password or damaged backup');
    this.name = 'WrongPasswordError';
  }
}

/** The text isn't an encrypted backup this version can open. */
export class InvalidEncryptedBackupError extends Error {
  constructor(detail: string) {
    super(`Not an encrypted backup: ${detail}`);
    this.name = 'InvalidEncryptedBackupError';
  }
}

/** The page has no WebCrypto: browsers only offer it on https:// and localhost. */
export class CryptoUnavailableError extends Error {
  constructor() {
    super('Encryption is only available over HTTPS or on localhost');
    this.name = 'CryptoUnavailableError';
  }
}

function subtleCrypto(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new CryptoUnavailableError();
  return subtle;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function base64ToBytes(text: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(text) || text.length % 4 !== 0) {
    throw new InvalidEncryptedBackupError('bad base64');
  }
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<CryptoKey> {
  const subtle = subtleCrypto();
  const material = await subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypts a backup's JSON text with a password and returns the file's text (JSON in the
 * `ub-finance-encrypted-backup` format). `iterations` is only lowered in tests.
 */
export async function encryptBackup(
  json: string,
  password: string,
  iterations = BACKUP_KDF_ITERATIONS,
): Promise<string> {
  const subtle = subtleCrypto();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt, iterations);
  const data = await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(json));
  const file: EncryptedBackupFile = {
    format: ENCRYPTED_BACKUP_FORMAT,
    version: ENCRYPTED_BACKUP_VERSION,
    kdf: 'PBKDF2-SHA256',
    iterations,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(data)),
  };
  return JSON.stringify(file);
}

function parseEncrypted(value: unknown): EncryptedBackupFile | null {
  if (typeof value !== 'object' || value === null) return null;
  const file = value as Record<string, unknown>;
  return file.format === ENCRYPTED_BACKUP_FORMAT ? (file as unknown as EncryptedBackupFile) : null;
}

/** Whether a file's text is an encrypted backup (whatever its version). */
export function isEncryptedBackup(text: string): boolean {
  try {
    return parseEncrypted(JSON.parse(text)) !== null;
  } catch {
    return false;
  }
}

/**
 * Opens an encrypted backup's file text with its password and returns the backup's JSON text.
 * Throws `WrongPasswordError` for a wrong password or changed data, and
 * `InvalidEncryptedBackupError` for text that isn't an encrypted backup this version reads.
 */
export async function decryptBackup(fileText: string, password: string): Promise<string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fileText);
  } catch {
    throw new InvalidEncryptedBackupError('not JSON');
  }
  const file = parseEncrypted(parsed);
  if (!file) throw new InvalidEncryptedBackupError('unknown format');
  if (file.version !== ENCRYPTED_BACKUP_VERSION) {
    throw new InvalidEncryptedBackupError(`version ${String(file.version)}`);
  }
  if (file.kdf !== 'PBKDF2-SHA256') throw new InvalidEncryptedBackupError('unknown kdf');
  const { iterations } = file;
  if (!Number.isSafeInteger(iterations) || iterations < 1 || iterations > MAX_ITERATIONS) {
    throw new InvalidEncryptedBackupError('bad iterations');
  }
  if (typeof file.salt !== 'string' || typeof file.iv !== 'string') {
    throw new InvalidEncryptedBackupError('missing salt or iv');
  }
  if (typeof file.data !== 'string') throw new InvalidEncryptedBackupError('missing data');
  const salt = base64ToBytes(file.salt);
  const iv = base64ToBytes(file.iv);
  const data = base64ToBytes(file.data);
  if (salt.length !== SALT_BYTES || iv.length !== IV_BYTES) {
    throw new InvalidEncryptedBackupError('bad salt or iv');
  }

  const subtle = subtleCrypto();
  const key = await deriveKey(password, salt, iterations);
  let plain: ArrayBuffer;
  try {
    plain = await subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  } catch {
    // GCM's tag didn't match: wrong password, or the salt, IV or data were changed
    throw new WrongPasswordError();
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(plain);
  } catch {
    throw new WrongPasswordError();
  }
}
