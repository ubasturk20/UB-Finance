import { useMemo } from 'react';
import { t } from '../../i18n';
import {
  TOP_TREND_CATEGORIES,
  useIncomeVsExpenses,
  useTopSpendingCategories,
} from '../../hooks/useReports';
import { expenseFigure, incomeFigure, monthsToAverage } from '../../utils/reportSummary';
import {
  NetWorthChart,
  IncomeExpensesChart,
  SpendingChart,
  SpendingTrendsChart,
} from './BuiltinCharts';
import { TransactionCalendar } from './TransactionCalendar';
import { ChartSkeleton } from './ChartHelpers';
import type { StatCard } from './ChartHelpers';
import type { BuiltinWidgetType } from '../../types';

export const BUILTIN_REPORTS: Record<BuiltinWidgetType, { label: string; description: string }> = {
  summary: { label: t('rep.builtin.summary'), description: t('rep.builtin.summary.desc') },
  'net-worth': { label: t('rep.builtin.netWorth'), description: t('rep.builtin.netWorth.desc') },
  'income-expenses': {
    label: t('rep.builtin.incomeExpenses'),
    description: t('rep.builtin.incomeExpenses.desc'),
  },
  spending: { label: t('rep.builtin.spending'), description: t('rep.builtin.spending.desc') },
  'spending-trends': {
    label: t('rep.builtin.spendingTrends'),
    description: t('rep.builtin.spendingTrends.desc'),
  },
  calendar: { label: t('rep.builtin.calendar'), description: t('rep.builtin.calendar.desc') },
};

export const BUILTIN_TYPES = Object.keys(BUILTIN_REPORTS) as BuiltinWidgetType[];

/**
 * Totals for the range. Expenses show what was spent (red), or "+$X" in green when refunds
 * outweighed spending. The monthly average counts only months since the budget's first
 * activity in the range.
 */
export function useSummaryCards(from: string, to: string): StatCard[] {
  const { data: ieData = [] } = useIncomeVsExpenses(from, to);
  return useMemo(() => {
    const totalInc = ieData.reduce((s, d) => s + d.income, 0);
    const expNet = ieData.reduce((s, d) => s + d.expenseNet, 0);
    const txCount = ieData.reduce((s, d) => s + d.expenseCount, 0);
    return [
      { label: t('rep.stat.totalIncome'), ...incomeFigure(totalInc) },
      { label: t('rep.stat.totalExpenses'), ...expenseFigure(expNet) },
      {
        label: t('rep.stat.avgMonthlyExpenses'),
        ...expenseFigure(expNet / monthsToAverage(ieData)),
      },
      {
        label: t('rep.stat.avgPerTransaction'),
        ...expenseFigure(txCount > 0 ? expNet / txCount : 0),
      },
    ];
  }, [ieData]);
}

const TONE_CLASS = {
  positive: 'text-positive',
  negative: 'text-negative',
  neutral: 'text-text-tertiary',
};

/**
 * The summary widget: four figures in a row next to the title on a wide card (the card is the
 * @container, see WidgetCard), two by two under it otherwise.
 */
function SummaryTiles({ from, to }: { from: string; to: string }) {
  const cards = useSummaryCards(from, to);
  return (
    <div className="h-full grid grid-cols-2 @4xl:grid-cols-4 gap-x-3 gap-y-2 content-center">
      {cards.map((c) => (
        <div key={c.label} className="text-center min-w-0">
          {/* A size down on narrow cards (a phone), so "$12,345.67" fits two to a row */}
          <p
            className={`text-lg @sm:text-xl font-semibold tabular-nums break-words ${c.tone ? TONE_CLASS[c.tone] : 'text-text'}`}
          >
            {c.value}
          </p>
          <p className="text-xs text-text-secondary mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Spending Trends on a dashboard: the widget's chosen categories, or else the
 * TOP_TREND_CATEGORIES with the most spending in the range.
 */
function DashboardSpendingTrends({
  from,
  to,
  categoryIds,
}: {
  from: string;
  to: string;
  categoryIds?: string[];
}) {
  const top = useTopSpendingCategories(from, to, TOP_TREND_CATEGORIES);
  const ids = categoryIds ?? top.ids;
  if (!categoryIds && top.isLoading) return <ChartSkeleton />;
  const caption = categoryIds
    ? undefined
    : ids.length === 1
      ? t('rep.trends.biggestOne')
      : t('rep.trends.biggestMany', { count: ids.length });
  return <SpendingTrendsChart from={from} to={to} categoryIds={ids} caption={caption} />;
}

/** A built-in report as its dashboard widget shows it (the full view is in ReportDetail). */
export function BuiltinReportChart({
  type,
  from,
  to,
  categoryIds,
}: {
  type: BuiltinWidgetType;
  from: string;
  to: string;
  /** Spending Trends: the categories to chart (undefined = the biggest ones) */
  categoryIds?: string[];
}) {
  switch (type) {
    case 'summary':
      return <SummaryTiles from={from} to={to} />;
    case 'net-worth':
      return <NetWorthChart from={from} to={to} headline />;
    case 'income-expenses':
      return <IncomeExpensesChart from={from} to={to} />;
    case 'spending':
      return <SpendingChart from={from} to={to} />;
    case 'calendar':
      return <TransactionCalendar from={from} to={to} fit />;
    case 'spending-trends':
      return <DashboardSpendingTrends from={from} to={to} categoryIds={categoryIds} />;
  }
}
