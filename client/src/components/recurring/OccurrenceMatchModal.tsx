import { useState, useMemo } from 'react';
import { format, parseISO, subDays, addDays } from 'date-fns';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { useTransactions } from '../../hooks/useTransactions';
import { useMatchOccurrence } from '../../hooks/useSchedules';
import { formatCurrency } from '../../utils/currency';
import type { ScheduleOccurrence } from '../../types';
import { formatDay } from '../../utils/dates';
import { t } from '../../i18n';
import { foldText } from '../../utils/textFold';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  occurrence: ScheduleOccurrence | null;
}

export default function OccurrenceMatchModal({ isOpen, onClose, occurrence }: Props) {
  const [search, setSearch] = useState('');
  const matchOcc = useMatchOccurrence();

  const dateRange = useMemo(() => {
    if (!occurrence) return { from: '', to: '' };
    const d = parseISO(occurrence.expectedDate);
    return {
      from: format(subDays(d, 14), 'yyyy-MM-dd'),
      to: format(addDays(d, 14), 'yyyy-MM-dd'),
    };
  }, [occurrence?.expectedDate]);

  const { data: transactions = [] } = useTransactions({
    from: dateRange.from,
    to: dateRange.to,
    accountId: occurrence?.scheduleAccountId || undefined,
    limit: 100,
  });

  const filtered = useMemo(() => {
    let list = transactions.filter((tx) => !tx.transferTransactionId && !tx.scheduleId);
    if (search) {
      const q = foldText(search);
      list = list.filter(
        (tx) => foldText(tx.payeeName).includes(q) || foldText(tx.notes).includes(q),
      );
    }
    return list;
  }, [transactions, search]);

  function handleMatch(transactionId: string) {
    if (!occurrence) return;
    matchOcc.mutate(
      { occurrenceId: occurrence.id, transactionId },
      {
        onSuccess: () => {
          onClose();
          setSearch('');
        },
      },
    );
  }

  if (!occurrence) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('rec.match.title')} size="lg">
      <div className="space-y-4">
        <div className="bg-surface-alt rounded-lg px-4 py-3 border border-border-light">
          <p className="text-sm font-medium text-text">{occurrence.scheduleName}</p>
          <p className="text-xs text-text-tertiary mt-0.5">
            {t('rec.match.expected', {
              date: formatDay(occurrence.expectedDate),
              amount: formatCurrency(occurrence.expectedAmount),
            })}
          </p>
        </div>

        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('rec.match.filter')}
        />

        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-8">{t('rec.match.none')}</p>
          ) : (
            <div className="divide-y divide-border-light">
              {filtered.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 py-2.5 px-2 hover:bg-hover rounded transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{tx.payeeName || '—'}</p>
                    <p className="text-xs text-text-tertiary">{formatDay(tx.date)}</p>
                  </div>
                  <span
                    className={`text-sm font-medium tabular-nums ${tx.amount > 0 ? 'text-positive' : 'text-text'}`}
                  >
                    {formatCurrency(tx.amount)}
                  </span>
                  <button
                    onClick={() => handleMatch(tx.id)}
                    className="px-3 py-1 text-xs font-medium text-brand-600 bg-brand-50 rounded-md hover:bg-brand-100 transition-colors"
                  >
                    {t('rec.match.match')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
