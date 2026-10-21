import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Download, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { restoreBackup } from '../../api/backup';
import { IS_DEMO, downloadFromApi } from '../../demo/demoApi';
import { decimalSeparator, useAmountStyle } from '../../utils/currency';
import { t } from '../../i18n';

const API_BASE = '/api/export';

// The server sends these as downloads; the demo's in-browser API can only answer fetch
const download = (url: string) =>
  IS_DEMO ? void downloadFromApi(url) : void (window.location.href = url);

export function DataExport() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const decimalComma = decimalSeparator(useAmountStyle().format) === ',';
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ name: string; data: unknown } | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const queryClient = useQueryClient();

  async function chooseBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again
    if (!file) return;
    setRestoreMessage(null);
    try {
      setPending({ name: file.name, data: JSON.parse(await file.text()) });
    } catch {
      setRestoreMessage({ ok: false, text: t('settings.data.notBackup', { name: file.name }) });
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
      </div>

      <div className="bg-surface-alt rounded-lg p-5 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-text">{t('settings.data.restoreTitle')}</h3>
          <p className="text-xs text-text-tertiary mt-0.5">{t('settings.data.restoreHint')}</p>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
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
