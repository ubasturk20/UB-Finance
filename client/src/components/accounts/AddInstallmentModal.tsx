import { useId, useState } from 'react';
import { addMonths, format, parseISO } from 'date-fns';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CurrencyInput } from '../ui/CurrencyInput';
import { AmountFields, useAmountValidity } from '../ui/amountValidity';
import { SavingPausedHint } from '../connection/SavingPausedHint';
import { useCanSave } from '../../hooks/useConnection';
import { useFormReset } from '../../hooks/useFormReset';
import { useCreateTransaction } from '../../hooks/useTransactions';
import { useCreateInstallment } from '../../hooks/useCreditCards';
import { formatMoney } from '../../utils/currency';
import { newClientId } from '../../utils/offline';
import { allocate } from '../../utils/money';
import { t } from '../../i18n';
import type { Account } from '../../types';

/** 2-36 installments, as Turkish cards offer */
const COUNTS = Array.from({ length: 35 }, (_, i) => i + 2);

const shiftMonth = (month: string, delta: number) =>
  format(addMonths(parseISO(`${month}-01`), delta), 'yyyy-MM');

interface Props {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  /** The statement month still open (the first installment's month by default) */
  defaultFirstMonth: string;
}

/** "Taksitli alışveriş ekle": a plan, and (by default) the purchase itself on the card */
export function AddInstallmentModal({ isOpen, onClose, account, defaultFirstMonth }: Props) {
  const [description, setDescription] = useState('');
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(3);
  const [firstMonth, setFirstMonth] = useState(defaultFirstMonth);
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [record, setRecord] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { allValid, report } = useAmountValidity();
  const canSave = useCanSave();
  const createTx = useCreateTransaction();
  const createPlan = useCreateInstallment();
  const ids = { description: useId(), count: useId(), month: useId(), date: useId() };

  useFormReset(isOpen ? account.id : null, () => {
    setDescription('');
    setTotal(0);
    setCount(3);
    setFirstMonth(defaultFirstMonth);
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setRecord(true);
    setError(null);
  });

  const months = Array.from({ length: 15 }, (_, i) => shiftMonth(defaultFirstMonth, i - 2));
  if (!months.includes(firstMonth)) months.unshift(firstMonth);
  const shares =
    total > 0
      ? allocate(
          total,
          Array.from({ length: count }, () => 1),
        )
      : [];
  const pending = createTx.isPending || createPlan.isPending;
  const ready = description.trim() !== '' && total > 0 && !!date && allValid && canSave;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || pending) return;
    setError(null);
    try {
      let transactionId: string | null = null;
      if (record) {
        const created = await createTx.mutateAsync({
          id: newClientId(),
          accountId: account.id,
          date,
          amount: -total,
          payeeName: description.trim(),
          notes: t('card.installmentForm.preview', {
            count,
            amount: formatMoney(shares[0] ?? 0, account.currency),
          }),
        });
        transactionId = created.id;
      }
      await createPlan.mutateAsync({
        accountId: account.id,
        data: {
          description: description.trim(),
          totalAmount: total,
          installmentCount: count,
          firstMonth,
          transactionId,
        },
      });
      onClose();
    } catch {
      setError(t('card.installmentForm.error'));
    }
  }

  const fieldClass =
    'block w-full rounded-md border border-border px-3 py-2 text-sm bg-surface text-text focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600';
  const labelClass = 'block text-sm font-medium text-text-secondary mb-1';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('card.installmentForm.title')} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor={ids.description} className={labelClass}>
            {t('card.installmentForm.description')}
          </label>
          <input
            id={ids.description}
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('card.installmentForm.descriptionPlaceholder')}
            maxLength={200}
            autoFocus
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>{t('card.installmentForm.total')}</label>
          <AmountFields report={report}>
            <CurrencyInput
              value={total}
              onChange={setTotal}
              aria-label={t('card.installmentForm.total')}
              currency={account.currency}
            />
          </AmountFields>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label htmlFor={ids.count} className={labelClass}>
              {t('card.installmentForm.count')}
            </label>
            <select
              id={ids.count}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className={fieldClass}
            >
              {COUNTS.map((n) => (
                <option key={n} value={n}>
                  {t('card.installmentForm.countOption', { count: n })}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor={ids.month} className={labelClass}>
              {t('card.installmentForm.firstMonth')}
            </label>
            <select
              id={ids.month}
              value={firstMonth}
              onChange={(e) => setFirstMonth(e.target.value)}
              aria-describedby={`${ids.month}-hint`}
              className={fieldClass}
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {format(parseISO(`${m}-01`), 'MMMM yyyy')}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p id={`${ids.month}-hint`} className="-mt-2 text-xs text-text-tertiary">
          {t('card.installmentForm.firstMonthHint')}
          {shares.length > 0 && (
            <>
              {' · '}
              <span className="tabular-nums text-text-secondary">
                {t('card.installmentForm.preview', {
                  count,
                  amount: formatMoney(shares[0], account.currency),
                })}
              </span>
            </>
          )}
        </p>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={record}
            onChange={(e) => setRecord(e.target.checked)}
            aria-describedby={`${ids.date}-record-hint`}
            className="mt-0.5 h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-text-secondary">
            {t('card.installmentForm.record')}
            <span id={`${ids.date}-record-hint`} className="block text-xs text-text-tertiary">
              {t('card.installmentForm.recordHint')}
            </span>
          </span>
        </label>

        {record && (
          <div>
            <label htmlFor={ids.date} className={labelClass}>
              {t('card.installmentForm.date')}
            </label>
            <input
              id={ids.date}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={fieldClass}
            />
          </div>
        )}

        {error && (
          <p role="alert" className="text-xs text-negative">
            {error}
          </p>
        )}
        <SavingPausedHint className="text-right" />
        <div className="flex justify-end gap-3 pt-2 border-t border-border-light">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={!ready || pending}>
            {pending ? t('common.saving') : t('common.add')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
