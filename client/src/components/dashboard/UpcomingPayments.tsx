import { Link } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { useAccounts } from '../../hooks/useAccounts';
import { useObligations } from '../../hooks/useCreditCards';
import { formatCurrency, formatMoney } from '../../utils/currency';
import { formatShortDay } from '../../utils/dates';
import { isCardType, isLoanType } from '../../utils/accountTypes';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ButtonLink } from '../ui/Button';
import { UnconvertedNote } from '../currency/UnconvertedNote';
import type { CardObligation, LoanObligation } from '../../types';
import { t } from '../../i18n';

/** "4 gün kaldı", "Bugün" or "Gecikti" */
function daysText(days: number): string {
  if (days < 0) return t('dash.obligations.overdue');
  if (days === 0) return t('dash.obligations.today');
  return t('dash.obligations.daysLeft', { days });
}

/** Overdue in red, due within three days in amber */
function daysTone(days: number | null): string {
  if (days === null) return 'text-text-tertiary';
  if (days < 0) return 'text-negative font-medium';
  if (days <= 3) return 'text-caution font-medium';
  return 'text-text-tertiary';
}

interface RowProps {
  accountId: string;
  name: string;
  /** Date and days left */
  when: string;
  whenTone: string;
  amount: string;
  /** Under the amount: the minimum payment or the installment count */
  detail: string;
}

/** One card or loan, linking to its account page */
function PaymentRow({ accountId, name, when, whenTone, amount, detail }: RowProps) {
  return (
    <li>
      <Link
        to={`/accounts/${accountId}`}
        className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-md hover:bg-hover transition-colors max-md:min-h-11"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text truncate">{name}</p>
          <p className={`text-xs truncate ${whenTone}`}>{when}</p>
        </div>
        <div className="text-right shrink-0 max-w-[50%] min-w-0">
          <p className="text-sm font-medium tabular-nums text-text truncate">{amount}</p>
          <p className="text-xs tabular-nums text-text-tertiary truncate">{detail}</p>
        </div>
      </Link>
    </li>
  );
}

function cardRow(card: CardObligation): RowProps {
  const money = (amount: number) => formatMoney(amount, card.currency);
  // Without a statement day the card has no statement: what's owed now stands in for it
  const hasStatement = card.remaining !== null;
  // Nothing left to pay on the statement: paid off, or nothing was spent in its period
  const settled = hasStatement && card.remaining === 0;
  let when = t('dash.obligations.noDueDay');
  if (card.dueDate !== null && card.daysLeft !== null) {
    const status = !settled
      ? daysText(card.daysLeft)
      : (card.statementDebt ?? 0) > 0
        ? t('dash.obligations.paid')
        : t('dash.obligations.noStatementDebt');
    when = `${formatShortDay(card.dueDate)} · ${status}`;
  }
  const detail = hasStatement
    ? card.minimumPayment !== null && !settled
      ? t('dash.obligations.minimum', { amount: money(card.minimumPayment) })
      : t('dash.obligations.statementDebt')
    : t('dash.obligations.cardDebtNow');
  return {
    accountId: card.accountId,
    name: card.name,
    when,
    whenTone: settled ? 'text-positive' : daysTone(card.daysLeft),
    amount: money(hasStatement ? card.remaining! : card.used),
    detail,
  };
}

function loanRow(loan: LoanObligation): RowProps {
  return {
    accountId: loan.accountId,
    name: loan.name,
    when: `${formatShortDay(loan.nextDate)} · ${daysText(loan.daysLeft)}`,
    whenTone: daysTone(loan.daysLeft),
    amount: formatMoney(loan.nextAmount, loan.currency),
    detail: t('dash.obligations.installments', { paid: loan.paidCount, term: loan.term }),
  };
}

function Section({ title, rows }: { title: string; rows: RowProps[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="min-w-0">
      <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
        {title}
      </h4>
      <ul className="divide-y divide-border-light">
        {rows.map((row) => (
          <PaymentRow key={row.accountId} {...row} />
        ))}
      </ul>
    </div>
  );
}

function Total({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 min-w-0">
      <span className="text-sm text-text-secondary truncate">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-text whitespace-nowrap">
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

/**
 * Credit cards' due dates and statements, and loans' next installments. Hidden while there
 * are no card or loan accounts at all (the dashboard stays uncluttered); with accounts but no
 * details entered, it says where to enter them.
 */
export default function UpcomingPayments() {
  const { data: accounts } = useAccounts();
  const hasAccounts = !!accounts?.some((a) => isCardType(a.type) || isLoanType(a.type));
  const { data, isLoading } = useObligations(hasAccounts);

  if (!hasAccounts) return null;

  if (isLoading || !data) {
    return (
      <Card className="h-full">
        <div className="h-5 w-32 bg-surface-alt rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-8 bg-surface-alt rounded animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  const empty = data.cards.length === 0 && data.loans.length === 0;

  return (
    <Card className="h-full min-w-0">
      <section aria-labelledby="upcoming-payments-title">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 id="upcoming-payments-title" className="text-sm font-semibold text-text">
            {t('dash.obligations.title')}
          </h3>
          <Link
            to="/accounts"
            className="text-xs text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap"
          >
            {t('dash.viewAll')}
          </Link>
        </div>

        {empty ? (
          <EmptyState
            compact
            icon={<CreditCard size={20} />}
            title={t('dash.obligations.emptyTitle')}
            description={t('dash.obligations.emptyDescription')}
            actions={
              <ButtonLink size="sm" to="/accounts">
                {t('dash.obligations.goToAccounts')}
              </ButtonLink>
            }
          />
        ) : (
          <div className="space-y-4">
            <Section title={t('dash.obligations.cards')} rows={data.cards.map(cardRow)} />
            <Section title={t('dash.obligations.loans')} rows={data.loans.map(loanRow)} />
            <div className="border-t border-border-light pt-3 space-y-1">
              {data.cards.length > 0 && (
                <Total label={t('dash.obligations.cardDebt')} amount={data.totals.cardDebt} />
              )}
              {data.loans.length > 0 && (
                <Total
                  label={t('dash.obligations.loanPrincipal')}
                  amount={data.totals.loanPrincipal}
                />
              )}
              <UnconvertedNote currencies={data.unconverted} />
            </div>
          </div>
        )}
      </section>
    </Card>
  );
}
