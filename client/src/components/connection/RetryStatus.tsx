import type { Connection } from '../../hooks/useConnection';
import { t } from '../../i18n';

/** "4 sn sonra tekrar denenecek" (or what's happening instead), shown while reconnecting */
export function retryLabel(c: Connection): string {
  if (c.checking) return t('shell.retry.checking');
  if (c.paused) return t('shell.retry.paused');
  if (c.secondsLeft !== null) return t('shell.retry.in', { seconds: c.secondsLeft });
  return t('shell.retry.soon');
}

/** Thin bar that fills up until the next automatic check. */
export function RetryProgress({ connection }: { connection: Connection }) {
  const pct = connection.checking ? 100 : Math.round(connection.progress * 100);
  return (
    <div
      role="progressbar"
      aria-label={t('shell.retry.progress')}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="h-1 w-full rounded-full bg-surface-alt overflow-hidden"
    >
      <div
        className={`h-full rounded-full bg-brand-500 transition-[width] duration-200 ease-linear ${
          connection.checking ? 'animate-pulse' : ''
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
