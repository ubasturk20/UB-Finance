import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// electron sets DB_PATH to appData, otherwise use project root
let dbPath: string;
if (process.env.DB_PATH) {
  dbPath = process.env.DB_PATH;
} else {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  dbPath = path.resolve(__dirname, '../../budget.db');
}

const dbOptions: ConstructorParameters<typeof Database>[1] = {};
if (process.env.DB_NATIVE_BINDING) {
  dbOptions.nativeBinding = process.env.DB_NATIVE_BINDING;
}

/** Where the database lives (':memory:' in tests) */
export const databasePath = dbPath;

export const sqlite = new Database(dbPath, dbOptions);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

/**
 * Makes a file (and, if given, its folder) readable only by the user the server runs as, so
 * other users on the machine can't copy the budget. POSIX only: Windows has no such modes
 * (the user profile folders are private already). Never fatal: a folder we don't own (e.g. a
 * mount point) just keeps its permissions, and the problem is logged.
 */
export function restrictToOwner(file: string, folder?: string): void {
  if (process.platform === 'win32' || file === ':memory:' || file === '') return;
  const change = (target: string, mode: number) => {
    try {
      fs.chmodSync(target, mode);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') return;
      console.warn('Could not restrict permissions of %s (%s)', JSON.stringify(target), code);
    }
  };
  if (folder) change(folder, 0o700);
  change(file, 0o600);
}

// The database and its WAL files (created on open with the process umask, often 0644). Its
// folder too when it was chosen for the data (Docker's /data, the desktop app's userData),
// not the source checkout that `npm run dev` keeps budget.db in.
if (dbPath !== ':memory:') {
  restrictToOwner(dbPath, process.env.DB_PATH ? path.dirname(path.resolve(dbPath)) : undefined);
  for (const suffix of ['-wal', '-shm']) restrictToOwner(dbPath + suffix);
}

export const db = drizzle(sqlite, { schema });
