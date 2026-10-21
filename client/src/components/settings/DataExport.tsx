import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Download, LockKeyhole, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Modal } from '../ui/Modal';
import { fetchBackup, restoreBackup } from '../../api/backup';
import {
  CryptoUnavailableError,
  ENCRYPTED_BACKUP_EXTENSION,
  MIN_BACKUP_PASSWORD_LENGTH,
  WrongPasswordError,
  decryptBackup,
  encryptBackup,
  isEncryptedBackup,
} from '../../utils/backupCrypto';
import { IS_DEMO, downloadFromApi } from '../../demo/demoApi';
import { decimalSeparator, useAmountStyle } from '../../utils/currency';
import { t } from '../../i18n';

const API_BASE = '/api/export';

// The server sends these as downloads; the demo's in-browser API can only answer fetch
const download = (url: string) =>
  IS_DEMO ? void downloadFromApi(url) : void (window.location.href = url);

const inputClass =
  'w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600';

function saveFile(text: string, name: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'application/octet-stream' }));
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/** "Download password-protected backup": the backup, encrypted in this browser. */
function EncryptedBackupModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const tooShort = password.length > 0 && password.length < MIN_BACKUP_PASSWORD_LENGTH;
  const mismatch = again.length > 0 && again !== password;
  const valid = password.length >= MIN_BACKUP_PASSWORD_LENGTH && again === password;

  function close() {
    if (busy) return;
    setPassword('');
    setAgain('');
    setError(null);
    setSaved(null);
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (!globalThis.crypto?.subtle) throw new CryptoUnavailableError();
      const backup = await fetchBackup();
      const file = await encryptBackup(JSON.stringify(backup), password);
      const day = format(new Date(), 'yyyy-MM-dd');
      const name = `ub-finance-yedek-${day}${ENCRYPTED_BACKUP_EXTENSION}`;
      saveFile(file, name);
      setPassword('');
      setAgain('');
      setSaved(name);
    } catch (err) {
      setError(
        err instanceof CryptoUnavailableError
          ? t('settings.data.cryptoUnavailable')
          : err instanceof Error && err.message
            ? err.message
            : t('settings.data.encryptFailed'),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={close} title={t('settings.data.encryptedTitle')} size="sm">
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-text-tertiary">{t('settings.data.encryptedHint')}</p>
        <p className="text-xs font-medium text-text-secondary">
          {t('settings.data.encryptedWarning')}
        </p>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('settings.data.backupPassword')}
          </label>
          <input
            type="password"
            autoComplete="new-password"
            aria-label={t('settings.data.backupPassword')}
            aria-invalid={tooShort || undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          {tooShort && (
            <p className="text-xs text-negative mt-1">
              {t('settings.data.passwordTooShort', { min: MIN_BACKUP_PASSWORD_LENGTH })}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('settings.data.backupPasswordAgain')}
          </label>
          <input
            type="password"
            autoComplete="new-password"
            aria-label={t('settings.data.backupPasswordAgain')}
            aria-invalid={mismatch || undefined}
            value={again}
            onChange={(e) => setAgain(e.target.value)}
            className={inputClass}
          />
          {mismatch && (
            <p className="text-xs text-negative mt-1">{t('settings.data.passwordMismatch')}</p>
          )}
        </div>
        {error && (
          <p role="alert" className="text-xs text-negative">
            {error}
          </p>
        )}
        {saved && (
          <p aria-live="polite" className="text-xs text-positive">
            {t('settings.data.encryptedSaved', { file: saved })}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={close} disabled={busy}>
            {saved ? t('common.close') : t('common.cancel')}
          </Button>
          <Button type="submit" disabled={!valid || busy}>
            <LockKeyhole size={14} />{' '}
            {busy ? t('settings.data.encrypting') : t('settings.data.encryptedDownload')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function DataExport() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const decimalComma = decimalSeparator(useAmountStyle().format) === ',';
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ name: string; data: unknown } | null>(null);
  // An encrypted backup waiting for its password
  const [locked, setLocked] = useState<{ name: string; text: string } | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [encryptOpen, setEncryptOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const queryClient = useQueryClient();

  async function chooseBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again
    if (!file) return;
    setRestoreMessage(null);
    try {
      const text = await file.text();
      if (isEncryptedBackup(text)) {
        setUnlockPassword('');
        setUnlockError(null);
        setLocked({ name: file.name, text });
        return;
      }
      setPending({ name: file.name, data: JSON.parse(text) });
    } catch {
      setRestoreMessage({ ok: false, text: t('settings.data.notBackup', { name: file.name }) });
    }
  }

  function closeUnlock() {
    if (unlocking) return;
    setLocked(null);
    setUnlockPassword('');
    setUnlockError(null);
  }

  // Opens the encrypted file in this browser, then restores it like any other backup
  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (!locked || !unlockPassword || unlocking) return;
    setUnlocking(true);
    setUnlockError(null);
    try {
      const data: unknown = JSON.parse(await decryptBackup(locked.text, unlockPassword));
      setLocked(null);
      setUnlockPassword('');
      setPending({ name: locked.name, data });
    } catch (err) {
      if (err instanceof WrongPasswordError) {
        setUnlockError(t('settings.data.wrongPassword'));
      } else if (err instanceof CryptoUnavailableError) {
        setUnlockError(t('settings.data.cryptoUnavailable'));
      } else {
        setLocked(null);
        setUnlockPassword('');
        setRestoreMessage({ ok: false, text: t('settings.data.notBackup', { name: locked.name }) });
      }
    } finally {
      setUnlocking(false);
    }
  }

  async function confirmRestore() {
    if (!pending) return;
    setRestoring(true);
    try {
      const result = await restoreBackup(pending.data);
      const count = result.restored.transactions ?? 0;
      setRestoreMessage({
        ok: true,
        text:
          t('settings.data.restored', { name: pending.name, count }) +
          (result.safetyCopy
            ? ` ${t('settings.data.safetyCopy', { file: result.safetyCopy })}`
            : ''),
      });
      // Everything on screen is from before the restore
      await queryClient.invalidateQueries();
    } catch (err) {
      setRestoreMessage({
        ok: false,
        text: err instanceof Error ? err.message : t('settings.data.restoreFailed'),
      });
    } finally {
      setRestoring(false);
      setPending(null);
    }
  }

  function downloadCsv() {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    // Spreadsheets in languages with a decimal comma expect 12,50 and ; between columns
    if (decimalComma) params.set('decimal', 'comma');
    const qs = params.toString();
    download(`${API_BASE}/transactions/csv${qs ? `?${qs}` : ''}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-text">{t('settings.data.title')}</h2>
        <p className="text-xs text-text-tertiary mt-0.5">{t('settings.data.intro')}</p>
      </div>

      <div className="bg-surface-alt rounded-lg p-5 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-text">{t('settings.data.exportTitle')}</h3>
          <p className="text-xs text-text-tertiary mt-0.5">{t('settings.data.exportHint')}</p>
          <p className="text-xs text-text-tertiary mt-1">
            {t('settings.data.formatBefore')}{' '}
            <Link to="/settings?tab=preferences" className="underline hover:text-text-secondary">
              {t('settings.tab.preferences')}
            </Link>{' '}
            {decimalComma ? t('settings.data.formatAfterComma') : t('settings.data.formatAfterDot')}
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-text-tertiary mb-1">
              {t('settings.data.from')}
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="text-sm border border-border rounded-md px-3 py-1.5 bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-tertiary mb-1">
              {t('settings.data.to')}
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="text-sm border border-border rounded-md px-3 py-1.5 bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600"
            />
          </div>
          <Button onClick={downloadCsv} size="sm">
            <Download size={14} /> {t('settings.data.downloadCsv')}
          </Button>
        </div>
      </div>

      <div className="bg-surface-alt rounded-lg p-5 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-text">{t('settings.data.backupTitle')}</h3>
          <p className="text-xs text-text-tertiary mt-0.5">{t('settings.data.backupHint')}</p>
        </div>
        <button
          onClick={() => {
            download(`${API_BASE}/backup`);
          }}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-text-secondary rounded-md hover:opacity-90 transition-colors"
        >
          <Download size={14} /> {t('settings.data.downloadBackup')}
        </button>
        <div className="space-y-1">
          <Button variant="secondary" size="sm" onClick={() => setEncryptOpen(true)}>
            <LockKeyhole size={14} /> {t('settings.data.encryptedButton')}
          </Button>
          <p className="text-xs text-text-tertiary">{t('settings.data.encryptedWarning')}</p>
        </div>
      </div>

      <div className="bg-surface-alt rounded-lg p-5 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-text">{t('settings.data.restoreTitle')}</h3>
          <p className="text-xs text-text-tertiary mt-0.5">{t('settings.data.restoreHint')}</p>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept={`application/json,.json,${ENCRYPTED_BACKUP_EXTENSION}`}
          className="hidden"
          aria-label={t('settings.data.backupFile')}
          onChange={chooseBackup}
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={restoring}
          onClick={() => fileInput.current?.click()}
        >
          <Upload size={14} />{' '}
          {restoring ? t('settings.data.restoring') : t('settings.data.restoreButton')}
        </Button>
        {restoreMessage && (
          <p
            role="status"
            className={`text-xs ${restoreMessage.ok ? 'text-text-secondary' : 'text-red-600'}`}
          >
            {restoreMessage.text}
          </p>
        )}
      </div>

      <EncryptedBackupModal isOpen={encryptOpen} onClose={() => setEncryptOpen(false)} />

      <Modal isOpen={locked !== null} onClose={closeUnlock} title={t('settings.data.unlockTitle')}>
        <form onSubmit={unlock} className="space-y-3">
          <p className="text-sm text-text-secondary">
            {t('settings.data.unlockMessage', {
              name: locked?.name ?? t('settings.data.theBackup'),
            })}
          </p>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t('settings.data.backupPassword')}
            </label>
            <input
              type="password"
              autoComplete="current-password"
              aria-label={t('settings.data.backupPassword')}
              aria-invalid={unlockError !== null || undefined}
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          {unlockError && (
            <p role="alert" className="text-xs text-negative">
              {unlockError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={closeUnlock} disabled={unlocking}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!unlockPassword || unlocking}>
              {unlocking ? t('settings.data.unlocking') : t('settings.data.unlockButton')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={confirmRestore}
        title={t('settings.data.confirmTitle')}
        message={t('settings.data.confirmMessage', {
          name: pending?.name ?? t('settings.data.theBackup'),
        })}
        confirmLabel={t('settings.data.confirmLabel')}
        danger
      />
    </div>
  );
}
