import { useState } from 'react';
import { ArrowLeftRight, ArrowRight } from 'lucide-react';
import {
  useDismissTransferSuggestion,
  useLinkTransfers,
  useTransferSuggestions,
} from '../../hooks/useTransfers';
import { useCanSave } from '../../hooks/useConnection';
import { formatMoney } from '../../utils/currency';
import { useAccountCurrency } from '../../hooks/useCurrency';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SavingPausedHint } from '../connection/SavingPausedHint';
import type { Transaction, TransferSuggestion } from '../../types';
import { formatDay } from '../../utils/dates';
import { t } from '../../i18n';

interface Props {
  /** The account whose register this is (all accounts when absent) */
  accountId?: string;
  accountName: (id: string) => string | undefined;
}

const keyOf = (s: TransferSuggestion) => `${s.outflow.id}|${s.inflow.id}`;
const shortDate = (date: string) => formatDay(date);

/**
 * Transfers hiding among ordinary transactions: the same amount leaving one account and
 * arriving in another within a few days, usually both sides imported from the banks. Shown
 * above the register; linking them keeps them out of spending and income.
 */
export function TransferSuggestions({ accountId, accountName }: Props) {
  const { data: suggestions = [] } = useTransferSuggestions(accountId);
  const [open, setOpen] = useState(false);
  const [unticked, setUnticked] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const linkMany = useLinkTransfers();
  const dismiss = useDismissTransferSuggestion();
  const canSave = useCanSave();

  if (suggestions.length === 0 && !notice) return null;

  const ticked = suggestions.filter((s) => !unticked.has(keyOf(s)));
  const count = suggestions.length;

  function toggle(s: TransferSuggestion) {
    const key = keyOf(s);
    setUnticked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function linkTicked() {
    const pairs = ticked.map((s) => ({
      transactionId: s.outflow.id,
      otherTransactionId: s.inflow.id,
    }));
    linkMany.mutate(pairs, {
      onSuccess: ({ linked, failed, interrupted }) => {
        setOpen(false);
        setNotice(
          t('txd.suggest.linked', { count: linked.length }) +
            (failed ? t('txd.suggest.skipped', { count: failed }) : '') +
            (interrupted ? t('txd.suggest.interrupted') : ''),
        );
      },
    });
  }

  return (
    <>
      <section
        aria-label={t('txd.suggest.region')}
        className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 border-b border-brand-100 bg-brand-50"
      >
        <ArrowLeftRight size={15} className="text-brand-600 shrink-0" aria-hidden />
        <span className="flex-1 min-w-0 text-sm text-text">
          {count > 0 ? (
            <>
              <span className="font-medium">{t('txd.suggest.count', { count })}</span>{' '}
              <span className="text-text-secondary">{t('txd.suggest.explain')}</span>
              {notice && (
                <span role="status" className="block text-text-secondary">
                  {notice}
                </span>
              )}
            </>
          ) : (
            <span role="status">{notice}</span>
          )}
        </span>
        {count > 0 ? (
          <Button
            size="sm"
            onClick={() => {
              setUnticked(new Set());
              setNotice(null);
              setOpen(true);
            }}
          >
            {t('txd.suggest.review')}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
            {t('common.close')}
          </Button>
        )}
      </section>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={t('txd.suggest.region')} size="xl">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            {t('txd.suggest.intro')}{' '}
            <span className="font-medium">{t('txd.panel.notTransfer')}</span>{' '}
            {t('txd.suggest.introAfter')}
          </p>
          <ul className="divide-y divide-border-light border border-border-light rounded-lg max-h-[50vh] overflow-y-auto">
            {suggestions.map((s) => (
              <SuggestionRow
                key={keyOf(s)}
                suggestion={s}
                accountName={accountName}
                checked={!unticked.has(keyOf(s))}
                onToggle={() => toggle(s)}
                onDismiss={() =>
                  dismiss.mutate({
                    transactionId: s.outflow.id,
                    otherTransactionId: s.inflow.id,
                  })
                }
                disabled={!canSave}
              />
            ))}
          </ul>
          {linkMany.isError && (
            <p role="alert" className="text-sm text-negative">
              {t('txd.suggest.linkError')}
            </p>
          )}
          {dismiss.isError && (
            <p role="alert" className="text-sm text-negative">
              {t('txd.suggest.dismissError')}
            </p>
          )}
          <SavingPausedHint />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={linkTicked}
              disabled={!canSave || ticked.length === 0 || linkMany.isPending}
            >
              {linkMany.isPending
                ? t('txd.suggest.linking')
                : t('txd.suggest.linkCount', { count: ticked.length })}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

interface RowProps {
  suggestion: TransferSuggestion;
  accountName: (id: string) => string | undefined;
  checked: boolean;
  onToggle: () => void;
  onDismiss: () => void;
  disabled: boolean;
}

function SuggestionRow({
  suggestion,
  accountName,
  checked,
  onToggle,
  onDismiss,
  disabled,
}: RowProps) {
  const { outflow, inflow } = suggestion;
  const currencyOf = useAccountCurrency();
  const sent = formatMoney(-outflow.amount, currencyOf(outflow.accountId));
  const received = formatMoney(inflow.amount, currencyOf(inflow.accountId));
  // Between currencies: what left and what arrived
  const amount =
    currencyOf(outflow.accountId) === currencyOf(inflow.accountId) ? sent : `${sent} → ${received}`;
  const from = accountName(outflow.accountId) ?? t('txd.suggest.anotherAccount');
  const to = accountName(inflow.accountId) ?? t('txd.suggest.anotherAccount');
  const side = (tx: Transaction, account: string) => (
    <span className="block min-w-0">
      <span className="block text-sm text-text truncate">{account}</span>
      <span className="block text-xs text-text-tertiary truncate">
        {shortDate(tx.date)} · {tx.payeeName || t('txd.suggest.noPayee')}
      </span>
    </span>
  );

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
      <label className="flex flex-1 min-w-0 items-center gap-3 cursor-pointer max-md:min-h-11">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={t('txd.suggest.linkPair', { amount, from, to })}
          className="h-4 w-4 shrink-0 rounded border-border text-brand-600 focus:ring-brand-500"
        />
        <span className="flex-1 min-w-0 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          {side(outflow, from)}
          <ArrowRight size={14} className="text-text-tertiary" aria-hidden />
          {side(inflow, to)}
        </span>
        <span className="text-sm font-medium tabular-nums text-text shrink-0">{amount}</span>
      </label>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDismiss}
        disabled={disabled}
        aria-label={t('txd.suggest.notTransferPair', { amount, from, to })}
      >
        {t('txd.panel.notTransfer')}
      </Button>
    </li>
  );
}
