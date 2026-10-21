import { useId, useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, Landmark, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { EmptyState } from '../ui/EmptyState';
import { useLoanSchedule } from '../../hooks/useCreditCards';
import { useCreateTransaction } from '../../hooks/useTransactions';
import { useCanSave } from '../../hooks/useConnection';
import { formatMoney } from '../../utils/currency';
import { formatDay } from '../../utils/dates';
import { formatPercent, t } from '../../i18n';
import type { Account, LoanRow, LoanSchedule } from '../../types';
import { Tile } from './CreditCardSummary';

/** Whole days from `from` to `to` (yyyy-MM-dd) */
function daysBetween(from: string, to: string): number {
  const utc = (d: string) =>
    Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

interface Props {
  account: Account;
  /** Opens the account dialog, where the loan details are entered */
  onEditDetails: () => void;
}

/** A loan's remaining principal, installments, next payment and payment plan */
export function LoanSummary({ account, onEditDetails }: Props) {
  const { data: loan } = useLoanSchedule(account.id);

  if (!loan) {
    return (
      <section
        aria-label={t('loan.summary.title')}
        className="px-6 max-md:px-4 py-3 border-b border-border bg-surface text-xs text-text-tertiary"
      >
        {t('loan.summary.loading')}
      </section>
    );
  }

  return (
    <section
      aria-label={t('loan.summary.title')}
      // On phones it scrolls on its own, so the register below keeps room
      className="shrink-0 px-6 max-md:px-4 py-3 border-b border-border bg-surface-alt max-md:max-h-[45vh] max-md:overflow-y-auto"
    >
      {loan.schedule && loan.status ? (
        <>
          <SummaryTiles loan={loan} currency={account.currency} />
          <BalanceSync account={account} remainingPrincipal={loan.status.remainingPrincipal} />
          <PaymentPlan
            rows={loan.schedule}
            paidCount={loan.status.paidCount}
            currency={account.currency}
          />
        </>
      ) : (
        <EmptyState
          compact
          icon={<Landmark size={20} />}
          title={t('loan.empty.title')}
          description={t('loan.empty.description')}
          actions={
            <Button size="sm" onClick={onEditDetails}>
              {t('loan.empty.action')}
            </Button>
          }
        />
      )}
    </section>
  );
}

function SummaryTiles({ loan, currency }: { loan: LoanSchedule; currency: string | null }) {
  const status = loan.status!;
  const total = loan.schedule!.length;
  const money = (amount: number) => formatMoney(amount, currency);
  const next = status.nextPayment;
  const days = next ? daysBetween(loan.today, next.date) : null;
  const rate = loan.details.loanRate;

  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
      <Tile label={t('loan.summary.remainingPrincipal')} value={money(status.remainingPrincipal)} />
      <Tile
        label={t('loan.summary.installments')}
        value={t('loan.summary.installmentsValue', { paid: status.paidCount, total })}
        note={
          status.remainingCount > 0
            ? t('loan.summary.installmentsNote', { count: status.remainingCount })
            : t('loan.summary.paidOff')
        }
      />
      <Tile
        label={t('loan.summary.nextPayment')}
        value={next ? money(next.payment) : t('loan.summary.noValue')}
        note={
          next
            ? days === 0
              ? t('loan.summary.nextPaymentToday', { date: formatDay(next.date) })
              : t('loan.summary.nextPaymentNote', { date: formatDay(next.date), days: days ?? 0 })
            : t('loan.summary.paidOff')
        }
        tone={days !== null && days <= 3 ? 'caution' : undefined}
      />
      <Tile
        label={t('loan.summary.monthlyPayment')}
        value={money(status.monthlyPayment)}
        note={
          rate !== null
            ? t('loan.summary.rateNote', { rate: formatPercent(rate / 10_000, 2) })
            : undefined
        }
      />
      <Tile label={t('loan.summary.totalRemaining')} value={money(status.totalRemainingPayment)} />
      <Tile
        label={t('loan.summary.interestAndTaxes')}
        value={money(status.totalInterestAndTaxes)}
        note={t('loan.summary.interestAndTaxesNote', {
          amount: money(status.loanInterestAndTaxes),
        })}
      />
    </dl>
  );
}

/**
 * Sets the account's balance to what the plan says is still owed, with a dated adjustment
 * (the same kind of transaction "Update balance" adds), after asking.
 */
function BalanceSync({
  account,
  remainingPrincipal,
}: {
  account: Account;
  remainingPrincipal: number;
}) {
  const [confirm, setConfirm] = useState(false);
  const createTransaction = useCreateTransaction();
  const canSave = useCanSave();
  const target = -remainingPrincipal;
  const change = target - account.balance;

  if (change === 0) {
    return <p className="mt-2 text-xs text-text-tertiary">{t('loan.sync.inSync')}</p>;
  }

  return (
    <div className="mt-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setConfirm(true)}
        disabled={!canSave || createTransaction.isPending}
      >
        <RefreshCw size={13} /> {t('loan.sync.action')}
      </Button>
      <ConfirmModal
        isOpen={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() =>
          createTransaction.mutate({
            accountId: account.id,
            date: format(new Date(), 'yyyy-MM-dd'),
            amount: change,
            notes: t('loan.sync.note'),
            adjustment: true,
          })
        }
        title={t('loan.sync.title')}
        message={t('loan.sync.message', {
          current: formatMoney(account.balance, account.currency),
          target: formatMoney(target, account.currency),
          change: `${change > 0 ? '+' : ''}${formatMoney(change, account.currency)}`,
        })}
        confirmLabel={t('loan.sync.confirm')}
      />
    </div>
  );
}

function PaymentPlan({
  rows,
  paidCount,
  currency,
}: {
  rows: LoanRow[];
  paidCount: number;
  currency: string | null;
}) {
  const [open, setOpen] = useState(false);
  const tableId = useId();
  const money = (amount: number) => formatMoney(amount, currency);
  const cell = 'px-3 py-1.5 text-right tabular-nums whitespace-nowrap';
  const head = 'px-3 py-2 text-right font-medium whitespace-nowrap';

  return (
    <div className="mt-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={tableId}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {open ? t('loan.schedule.hide') : t('loan.schedule.show')}
      </Button>
      {open && (
        // A narrow screen scrolls the table sideways on its own; the page never does
        <div
          id={tableId}
          className="mt-2 rounded-lg border border-border-light bg-surface overflow-x-auto"
        >
          <table aria-label={t('loan.schedule.title')} className="w-full text-xs">
            <thead className="text-text-tertiary border-b border-border-light">
              <tr>
                <th scope="col" className={`${head} text-left`}>
                  {t('loan.schedule.n')}
                </th>
                <th scope="col" className={`${head} text-left`}>
                  {t('loan.schedule.date')}
                </th>
                <th scope="col" className={head}>
                  {t('loan.schedule.payment')}
                </th>
                <th scope="col" className={head}>
                  {t('loan.schedule.principal')}
                </th>
                <th scope="col" className={head}>
                  {t('loan.schedule.interest')}
                </th>
                <th scope="col" className={head}>
                  {t('loan.schedule.kkdf')}
                </th>
                <th scope="col" className={head}>
                  {t('loan.schedule.bsmv')}
                </th>
                <th scope="col" className={head}>
                  {t('loan.schedule.balance')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {rows.map((row) => {
                const paid = row.n <= paidCount;
                return (
                  <tr
                    key={row.n}
                    className={paid ? 'text-text-tertiary opacity-60' : 'text-text'}
                    title={paid ? t('loan.schedule.paid') : undefined}
                  >
                    <td className={`${cell} text-left`}>{row.n}</td>
                    <td className={`${cell} text-left`}>{formatDay(row.date)}</td>
                    <td className={`${cell} font-medium`}>{money(row.payment)}</td>
                    <td className={cell}>{money(row.principal)}</td>
                    <td className={cell}>{money(row.interest)}</td>
                    <td className={cell}>{money(row.kkdf)}</td>
                    <td className={cell}>{money(row.bsmv)}</td>
                    <td className={cell}>{money(row.balance)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
