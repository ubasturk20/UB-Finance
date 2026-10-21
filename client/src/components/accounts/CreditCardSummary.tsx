import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { EmptyState } from '../ui/EmptyState';
import { useCardSummary, useDeleteInstallment, useInstallments } from '../../hooks/useCreditCards';
import { useCanSave } from '../../hooks/useConnection';
import { formatMoney } from '../../utils/currency';
import { formatDay } from '../../utils/dates';
import { formatPercent, t } from '../../i18n';
import type { Account, CardSummary, InstallmentPlan } from '../../types';
import { AddInstallmentModal } from './AddInstallmentModal';

/** "Ekim 2026" */
const monthName = (month: string) => format(parseISO(`${month}-01`), 'MMMM yyyy');

interface Props {
  account: Account;
  /** Opens the account dialog, where the card details are entered */
  onEditDetails: () => void;
}

/** A credit card's limit, last statement, minimum payment, due date and installments */
export function CreditCardSummary({ account, onEditDetails }: Props) {
  const { data: summary } = useCardSummary(account.id);
  const { data: plans } = useInstallments(account.id);
  const [addOpen, setAddOpen] = useState(false);
  const canSave = useCanSave();

  if (!summary) {
    return (
      <section
        aria-label={t('card.summary.title')}
        className="px-6 max-md:px-4 py-3 border-b border-border bg-surface text-xs text-text-tertiary"
      >
        {t('card.summary.loading')}
      </section>
    );
  }

  return (
    <section
      aria-label={t('card.summary.title')}
      // On phones it scrolls on its own, so the register below keeps room
      className="shrink-0 px-6 max-md:px-4 py-3 border-b border-border bg-surface-alt max-md:max-h-[45vh] max-md:overflow-y-auto"
    >
      {summary.hasDetails ? (
        <SummaryTiles summary={summary} currency={account.currency} />
      ) : (
        <EmptyState
          compact
          icon={<CreditCard size={20} />}
          title={t('card.empty.title')}
          description={t('card.empty.description')}
          actions={
            <Button size="sm" onClick={onEditDetails}>
              {t('card.empty.action')}
            </Button>
          }
        />
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-text">{t('card.installments.title')}</h2>
        <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)} disabled={!canSave}>
          <Plus size={13} /> {t('card.installments.add')}
        </Button>
      </div>
      <InstallmentList plans={plans ?? []} currency={account.currency} accountId={account.id} />

      <AddInstallmentModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        account={account}
        defaultFirstMonth={summary.openMonth}
      />
    </section>
  );
}

export function Tile({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: 'negative' | 'caution';
}) {
  const toneClass =
    tone === 'negative' ? 'text-negative' : tone === 'caution' ? 'text-caution' : 'text-text';
  return (
    <div className="min-w-0 rounded-lg border border-border-light bg-surface px-3 py-2">
      <dt className="text-xs text-text-tertiary truncate">{label}</dt>
      <dd className={`text-sm font-semibold tabular-nums break-words ${toneClass}`}>{value}</dd>
      {note && <dd className="text-xs text-text-tertiary break-words">{note}</dd>}
    </div>
  );
}

function dueNote(summary: CardSummary): { text: string; tone?: 'negative' | 'caution' } | null {
  if (summary.daysUntilDue === null) return null;
  const unpaid = (summary.remainingAfterPayments ?? 0) > 0;
  if (!unpaid && (summary.statementDebt ?? 0) > 0) return { text: t('card.summary.paid') };
  if (summary.daysUntilDue < 0) {
    return unpaid ? { text: t('card.summary.overdue'), tone: 'negative' } : null;
  }
  if (summary.daysUntilDue === 0) return { text: t('card.summary.dueToday'), tone: 'caution' };
  return {
    text: t('card.summary.daysLeft', { days: summary.daysUntilDue }),
    tone: summary.daysUntilDue <= 3 && unpaid ? 'caution' : undefined,
  };
}

function SummaryTiles({ summary, currency }: { summary: CardSummary; currency: string | null }) {
  const money = (amount: number | null) =>
    amount === null ? t('card.summary.noValue') : formatMoney(amount, currency);
  const due = dueNote(summary);
  const overLimit = summary.available !== null && summary.available < 0;

  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2">
      <Tile
        label={t('card.summary.limit')}
        value={money(summary.limit)}
        note={
          summary.interestRate !== null
            ? t('card.summary.interest', { rate: formatPercent(summary.interestRate / 10_000, 2) })
            : undefined
        }
      />
      <Tile label={t('card.summary.used')} value={money(summary.used)} />
      <Tile
        label={t('card.summary.available')}
        value={money(summary.available)}
        note={overLimit ? t('card.summary.overLimit') : undefined}
        tone={overLimit ? 'negative' : undefined}
      />
      <Tile
        label={t('card.summary.statementDebt')}
        value={money(summary.statementDebt)}
        note={
          summary.lastStatement
            ? t('card.summary.statementOn', { date: formatDay(summary.lastStatement) })
            : t('card.summary.noStatementDay')
        }
      />
      <Tile
        label={t('card.summary.minimumPayment')}
        value={money(summary.minimumPayment)}
        note={
          summary.remainingAfterPayments !== null &&
          summary.remainingAfterPayments !== summary.statementDebt
            ? t('card.summary.remaining', { amount: money(summary.remainingAfterPayments) })
            : undefined
        }
      />
      <Tile
        label={t('card.summary.dueDate')}
        value={summary.dueDate ? formatDay(summary.dueDate) : t('card.summary.noValue')}
        note={due?.text}
        tone={due?.tone}
      />
      <Tile
        label={t('card.summary.installmentDebt')}
        value={money(summary.installmentDebtRemaining)}
      />
    </dl>
  );
}

function InstallmentList({
  plans,
  currency,
  accountId,
}: {
  plans: InstallmentPlan[];
  currency: string | null;
  accountId: string;
}) {
  const remove = useDeleteInstallment();
  const canSave = useCanSave();
  const [confirm, setConfirm] = useState<InstallmentPlan | null>(null);

  if (!plans.length) {
    return <p className="mt-1 text-xs text-text-tertiary">{t('card.installments.empty')}</p>;
  }

  return (
    <>
      <ul className="mt-2 divide-y divide-border-light rounded-lg border border-border-light bg-surface">
        {plans.map((plan) => {
          const finished = plan.remainingCount === 0 && plan.current >= plan.installmentCount;
          const progress =
            plan.current === 0
              ? t('card.installments.notStarted', { month: monthName(plan.firstMonth) })
              : t('card.installments.progress', {
                  current: plan.current,
                  count: plan.installmentCount,
                });
          return (
            <li key={plan.id} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text truncate">{plan.description}</p>
                <p className="text-xs text-text-tertiary break-words">
                  {progress}
                  {' · '}
                  {t('card.installments.perMonth', {
                    amount: formatMoney(plan.perInstallment, currency),
                  })}
                </p>
              </div>
              <span className="shrink-0 text-right text-xs tabular-nums text-text-secondary">
                {finished
                  ? t('card.installments.finished')
                  : t('card.installments.remaining', {
                      amount: formatMoney(plan.remainingAmount, currency),
                    })}
              </span>
              <button
                type="button"
                onClick={() => setConfirm(plan)}
                disabled={!canSave}
                aria-label={t('card.installments.deleteAria', { name: plan.description })}
                className="shrink-0 p-1.5 max-md:min-h-11 max-md:min-w-11 flex items-center justify-center rounded text-text-tertiary hover:text-negative hover:bg-hover transition-colors disabled:opacity-40"
              >
                <Trash2 size={14} />
              </button>
            </li>
          );
        })}
      </ul>
      <ConfirmModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && remove.mutate({ id: confirm.id, accountId })}
        title={t('card.installments.delete')}
        message={t('card.installments.deleteConfirm', { name: confirm?.description ?? '' })}
        confirmLabel={t('common.delete')}
        danger
      />
    </>
  );
}
