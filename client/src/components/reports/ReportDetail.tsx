import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { Check, ChevronDown, Download, X } from 'lucide-react';
import { formatPercent, t } from '../../i18n';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { StatCard as StatTile } from '../ui/StatCard';
import {
  MAX_TREND_CATEGORIES,
  TOP_TREND_CATEGORIES,
  useDailyFlow,
  useIncomeVsExpenses,
  useNetWorth,
  useNetWorthSeries,
  useSpendingByCategory,
  useSpendingTrends,
  useTopSpendingCategories,
} from '../../hooks/useReports';
import { useAccounts } from '../../hooks/useAccounts';
import { useCategories } from '../../hooks/useCategories';
import { usePayees } from '../../hooks/usePayees';
import { useTransactions } from '../../hooks/useTransactions';
import { usePreferencesStore } from '../../store/preferencesStore';
import { formatCurrency } from '../../utils/currency';
import { downloadCsv } from '../../utils/exportCsv';
import { dayBounds, monthCount } from '../../utils/dateRange';
import { CALENDAR_MONTHS_MAX } from '../../utils/calendarLayout';
import { PayeeIcon } from '../payees/PayeeIcon';
import { TransactionCalendar } from './TransactionCalendar';
import { CATEGORY_COLORS } from '../../utils/chartColors';
import {
  IncomeExpensesChart,
  MonthlySpendingChart,
  NetWorthChart,
  SpendingChart,
  SpendingTrendsChart,
  categoryLabel,
  formatChange,
  netWorthChange,
} from './BuiltinCharts';
import { useSummaryCards } from './BuiltinReport';
import { EXPENSE_COLORS } from './ChartHelpers';
import type { StatCard } from './ChartHelpers';
import type { BuiltinWidgetType } from '../../types';
import { formatWeekday } from '../../utils/dates';

// The full view of every built-in report has the same parts, top to bottom: four headline
// figures, the chart, and a table of the numbers behind it (which is what Export CSV saves).

const TONE_CLASS = {
  positive: 'text-positive',
  negative: 'text-negative',
  neutral: 'text-text-tertiary',
} as const;

const toneOf = (cents: number): StatCard['tone'] =>
  cents > 0 ? 'positive' : cents < 0 ? 'negative' : 'neutral';

const fullMonth = (month: string) => format(parseISO(`${month}-01`), 'MMM yyyy');
const percent = (part: number, whole: number) => (whole > 0 ? formatPercent(part / whole) : '—');

interface Column<R> {
  label: string;
  align?: 'left' | 'right';
  cell: (row: R, index: number) => React.ReactNode;
}

interface FooterRow {
  label: string;
  /** One cell per column after the first */
  cells: React.ReactNode[];
}

function BreakdownTable<R>({
  columns,
  rows,
  rowKey,
  footer = [],
  onRowClick,
  selectedKey,
  maxRows,
}: {
  columns: Column<R>[];
  rows: R[];
  rowKey: (row: R) => string;
  footer?: FooterRow[];
  onRowClick?: (row: R) => void;
  selectedKey?: string | null;
  /** Show only this many rows until "Show all" is clicked */
  maxRows?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const align = (c: Column<R>) => (c.align === 'right' ? 'text-right' : 'text-left');
  const shown = maxRows && !showAll ? rows.slice(0, maxRows) : rows;
  if (!rows.length) {
    return (
      <p className="px-4 py-10 text-sm text-center text-text-tertiary">{t('rep.detail.noData')}</p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-alt border-y border-border">
          <tr>
            {columns.map((c) => (
              <th
                key={c.label}
                className={`px-4 py-2 text-xs font-medium text-text-tertiary whitespace-nowrap ${align(c)}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {shown.map((r, i) => (
            <tr
              key={rowKey(r)}
              onClick={onRowClick && (() => onRowClick(r))}
              className={`hover:bg-hover transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${
                selectedKey === rowKey(r) ? 'bg-brand-50' : ''
              }`}
            >
              {columns.map((c, ci) => (
                <td
                  key={c.label}
                  className={`px-4 py-2 whitespace-nowrap ${align(c)} ${
                    ci === 0 ? 'text-text' : 'tabular-nums text-text-secondary'
                  }`}
                >
                  {c.cell(r, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer.length > 0 && (
          <tfoot className="border-t border-border">
            {footer.map((f) => (
              <tr key={f.label}>
                <td className="px-4 py-2 font-semibold text-text">{f.label}</td>
                {f.cells.map((cell, i) => (
                  <td
                    key={i}
                    className={`px-4 py-2 font-semibold tabular-nums text-text whitespace-nowrap ${align(columns[i + 1])}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tfoot>
        )}
      </table>
      {shown.length < rows.length && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full px-4 py-2.5 text-xs font-medium text-brand-600 hover:bg-hover border-t border-border-light cursor-pointer"
        >
          {t('rep.detail.showAll', { count: rows.length })}
        </button>
      )}
    </div>
  );
}

/** A signed amount colored by sign, for net and change columns. */
function Signed({ cents, children }: { cents: number; children?: React.ReactNode }) {
  return <span className={TONE_CLASS[toneOf(cents)!]}>{children ?? formatCurrency(cents)}</span>;
}

function Swatch({ color }: { color?: string }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full mr-2 shrink-0 align-middle"
      style={{ background: color ?? 'var(--color-border)' }}
    />
  );
}

function ShareBar({ part, whole }: { part: number; whole: number }) {
  const pct = whole > 0 ? (part / whole) * 100 : 0;
  return (
    <span className="inline-flex items-center gap-2 justify-end">
      <span className="hidden sm:block w-16 h-1.5 rounded-full bg-surface-alt overflow-hidden">
        <span className="block h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
      </span>
      <span className="w-12 text-right">{percent(part, whole)}</span>
    </span>
  );
}

/** The layout every report detail shares. */
function DetailLayout({
  stats,
  loading,
  chartTitle,
  chartSubtitle,
  chartActions,
  chartHeight = 'h-80',
  chart,
  extra,
  tableTitle,
  table,
  onExport,
}: {
  stats: StatCard[];
  loading: boolean;
  chartTitle: string;
  chartSubtitle?: React.ReactNode;
  chartActions?: React.ReactNode;
  chartHeight?: string;
  chart: React.ReactNode;
  /** Shown between the chart and the table */
  extra?: React.ReactNode;
  tableTitle: string;
  table: React.ReactNode;
  onExport?: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-[72px] bg-surface-alt rounded-lg animate-pulse" />
            ))
          : stats.map((s) => (
              <StatTile
                key={s.label}
                label={s.label}
                value={s.value}
                sub={s.sub}
                valueColor={s.tone ? TONE_CLASS[s.tone] : undefined}
              />
            ))}
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text">{chartTitle}</h3>
            {chartSubtitle && <p className="text-xs text-text-tertiary mt-0.5">{chartSubtitle}</p>}
          </div>
          {chartActions}
        </div>
        <div className={`w-full ${chartHeight}`}>{chart}</div>
      </Card>

      {extra}

      <Card padding="none" className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <h3 className="text-sm font-semibold text-text">{tableTitle}</h3>
          {onExport && (
            <Button variant="secondary" size="sm" onClick={onExport}>
              <Download size={13} /> {t('rep.detail.exportCsv')}
            </Button>
          )}
        </div>
        {table}
      </Card>
    </div>
  );
}

interface DetailProps {
  from: string;
  to: string;
}

const csvName = (type: BuiltinWidgetType, from: string, to: string) =>
  t('rep.csv.filename', { type, from, to });

function SummaryDetail({ from, to }: DetailProps) {
  const { data = [], isLoading } = useIncomeVsExpenses(from, to);
  const stats = useSummaryCards(from, to);
  const rows = data.map((d) => ({
    month: d.month,
    income: d.income,
    expenses: -d.expenseNet,
    net: d.income + d.expenseNet,
    count: d.expenseCount,
  }));
  const sum = (key: 'income' | 'expenses' | 'net' | 'count') =>
    rows.reduce((s, r) => s + r[key], 0);
  const months = Math.max(rows.length, 1);
  const avg = (key: 'income' | 'expenses' | 'net') => Math.round(sum(key) / months);

  return (
    <DetailLayout
      loading={isLoading}
      stats={stats}
      chartTitle={t('rep.summary.chartTitle')}
      chartSubtitle={t('rep.summary.chartSubtitle')}
      chart={<MonthlySpendingChart from={from} to={to} />}
      tableTitle={t('rep.monthlyBreakdown')}
      onExport={() =>
        downloadCsv(
          csvName('summary', from, to),
          rows.map((r) => ({
            [t('rep.csv.month')]: r.month,
            [t('rep.csv.incomeMinor')]: r.income,
            [t('rep.csv.expensesMinor')]: r.expenses,
            [t('rep.csv.netMinor')]: r.net,
            [t('rep.csv.transactions')]: r.count,
          })),
        )
      }
      table={
        <BreakdownTable
          rows={rows}
          rowKey={(r) => r.month}
          columns={[
            { label: t('rep.col.month'), cell: (r) => fullMonth(r.month) },
            { label: t('rep.col.income'), align: 'right', cell: (r) => formatCurrency(r.income) },
            {
              label: t('rep.col.expenses'),
              align: 'right',
              cell: (r) => formatCurrency(r.expenses),
            },
            { label: t('rep.col.net'), align: 'right', cell: (r) => <Signed cents={r.net} /> },
            { label: t('rep.col.transactions'), align: 'right', cell: (r) => r.count },
          ]}
          footer={[
            {
              label: t('rep.col.total'),
              cells: [
                formatCurrency(sum('income')),
                formatCurrency(sum('expenses')),
                <Signed cents={sum('net')} />,
                sum('count'),
              ],
            },
            {
              label: t('rep.col.monthlyAverage'),
              cells: [
                formatCurrency(avg('income')),
                formatCurrency(avg('expenses')),
                <Signed cents={avg('net')} />,
                Math.round(sum('count') / months),
              ],
            },
          ]}
        />
      }
    />
  );
}

function NetWorthDetail({ from, to }: DetailProps) {
  // The stats follow the chart (daily for short ranges); the table is always month by month
  const { data: series = [], isLoading } = useNetWorthSeries(from, to);
  const { data: monthly = [] } = useNetWorth(from, to);
  const change = netWorthChange(series);
  const last = series[series.length - 1];
  const stats: StatCard[] = [
    { label: t('rep.netWorth.stat'), value: formatCurrency(change?.latest ?? 0) },
    {
      label: t('rep.netWorth.change'),
      value: change ? formatChange(change.change, change.percent) : formatCurrency(0),
      tone: toneOf(change?.change ?? 0),
    },
    { label: t('rep.netWorth.assets'), value: formatCurrency(last?.assets ?? 0) },
    { label: t('rep.netWorth.liabilities'), value: formatCurrency(last?.liabilities ?? 0) },
  ];
  const rows = monthly.map((d, i) => ({
    ...d,
    change: i > 0 ? d.netWorth - monthly[i - 1].netWorth : null,
  }));

  return (
    <DetailLayout
      loading={isLoading}
      stats={stats}
      chartTitle={t('rep.netWorth.chartTitle')}
      chartSubtitle={t('rep.netWorth.chartSubtitle')}
      chartHeight="h-96"
      chart={<NetWorthChart from={from} to={to} />}
      tableTitle={t('rep.netWorth.tableTitle')}
      onExport={() =>
        downloadCsv(
          csvName('net-worth', from, to),
          rows.map((r) => ({
            [t('rep.csv.month')]: r.month,
            [t('rep.csv.assetsMinor')]: r.assets,
            [t('rep.csv.liabilitiesMinor')]: r.liabilities,
            [t('rep.csv.netWorthMinor')]: r.netWorth,
            [t('rep.csv.changeMinor')]: r.change ?? '',
          })),
        )
      }
      table={
        <BreakdownTable
          rows={rows}
          rowKey={(r) => r.month}
          columns={[
            { label: t('rep.col.month'), cell: (r) => fullMonth(r.month) },
            { label: t('rep.col.assets'), align: 'right', cell: (r) => formatCurrency(r.assets) },
            {
              label: t('rep.col.liabilities'),
              align: 'right',
              cell: (r) => formatCurrency(r.liabilities),
            },
            {
              label: t('rep.col.netWorth'),
              align: 'right',
              cell: (r) => <span className="text-text">{formatCurrency(r.netWorth)}</span>,
            },
            {
              label: t('rep.col.change'),
              align: 'right',
              cell: (r) =>
                r.change === null ? (
                  '—'
                ) : (
                  <Signed cents={r.change}>
                    {r.change > 0 ? '+' : ''}
                    {formatCurrency(r.change)}
                  </Signed>
                ),
            },
          ]}
        />
      }
    />
  );
}

function IncomeExpensesDetail({ from, to }: DetailProps) {
  const { data = [], isLoading } = useIncomeVsExpenses(from, to);
  const income = data.reduce((s, d) => s + d.income, 0);
  const expenses = data.reduce((s, d) => s + d.expenses, 0);
  const net = income - expenses;
  const months = Math.max(data.length, 1);
  const rate = (i: number, n: number) => (i > 0 ? formatPercent(n / i, 0) : '—');
  const stats: StatCard[] = [
    { label: t('rep.ie.income'), value: formatCurrency(income), tone: 'positive' },
    { label: t('rep.ie.expenses'), value: formatCurrency(expenses), tone: 'negative' },
    { label: t('rep.ie.netSavings'), value: formatCurrency(net), tone: toneOf(net) },
    {
      label: t('rep.ie.savingsRate'),
      value: rate(income, net),
      tone: income > 0 ? toneOf(net) : undefined,
    },
  ];

  return (
    <DetailLayout
      loading={isLoading}
      stats={stats}
      chartTitle={t('rep.ie.chartTitle')}
      chartSubtitle={t('rep.ie.chartSubtitle')}
      chart={<IncomeExpensesChart from={from} to={to} />}
      tableTitle={t('rep.monthlyBreakdown')}
      onExport={() =>
        downloadCsv(
          csvName('income-expenses', from, to),
          data.map((d) => ({
            [t('rep.csv.month')]: d.month,
            [t('rep.csv.incomeMinor')]: d.income,
            [t('rep.csv.expensesMinor')]: d.expenses,
            [t('rep.csv.netMinor')]: d.net,
          })),
        )
      }
      table={
        <BreakdownTable
          rows={data}
          rowKey={(r) => r.month}
          columns={[
            { label: t('rep.col.month'), cell: (r) => fullMonth(r.month) },
            { label: t('rep.col.income'), align: 'right', cell: (r) => formatCurrency(r.income) },
            {
              label: t('rep.col.expenses'),
              align: 'right',
              cell: (r) => formatCurrency(r.expenses),
            },
            { label: t('rep.col.net'), align: 'right', cell: (r) => <Signed cents={r.net} /> },
            {
              label: t('rep.col.savingsRate'),
              align: 'right',
              cell: (r) => rate(r.income, r.net),
            },
          ]}
          footer={[
            {
              label: t('rep.col.total'),
              cells: [
                formatCurrency(income),
                formatCurrency(expenses),
                <Signed cents={net} />,
                rate(income, net),
              ],
            },
            {
              label: t('rep.col.monthlyAverage'),
              cells: [
                formatCurrency(Math.round(income / months)),
                formatCurrency(Math.round(expenses / months)),
                <Signed cents={Math.round(net / months)} />,
                '',
              ],
            },
          ]}
        />
      }
    />
  );
}

function SpendingDetail({ from, to }: DetailProps) {
  const showIcons = usePreferencesStore((s) => s.showCategoryIcons);
  const { data = [], isLoading } = useSpendingByCategory(from, to);
  const rows = useMemo(
    () =>
      [...data]
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .map((d) => ({
          ...d,
          id: d.categoryId ?? 'uncategorized',
          label: categoryLabel({ name: d.categoryName, icon: d.categoryIcon }, showIcons),
        })),
    [data, showIcons],
  );
  const total = rows.reduce((s, r) => s + r.totalSpent, 0);
  const months = monthCount(from, to);
  const top = rows[0];
  const stats: StatCard[] = [
    { label: t('rep.spending.totalSpent'), value: formatCurrency(total) },
    { label: t('rep.spending.monthlyAverage'), value: formatCurrency(Math.round(total / months)) },
    {
      label: t('rep.spending.biggestCategory'),
      value: top ? formatCurrency(top.totalSpent) : '—',
      sub: top?.label,
    },
    { label: t('rep.spending.categories'), value: String(rows.length) },
  ];

  return (
    <DetailLayout
      loading={isLoading}
      stats={stats}
      chartTitle={rows.length > 10 ? t('rep.spending.top10') : t('rep.spending.byCategory')}
      chartSubtitle={rows.length > 10 ? t('rep.spending.allListed') : undefined}
      chartHeight="h-96"
      chart={<SpendingChart from={from} to={to} />}
      tableTitle={t('rep.spending.allCategories')}
      onExport={() =>
        downloadCsv(
          csvName('spending', from, to),
          rows.map((r) => ({
            [t('rep.csv.category')]: r.label,
            [t('rep.csv.group')]: r.groupName ?? '',
            [t('rep.csv.spentMinor')]: r.totalSpent,
            [t('rep.csv.monthlyAverageMinor')]: Math.round(r.totalSpent / months),
          })),
        )
      }
      table={
        <BreakdownTable
          rows={rows}
          rowKey={(r) => r.id}
          columns={[
            {
              label: t('rep.col.category'),
              // The chart colors its ten bars in this same order
              cell: (r, i) => (
                <span className="inline-flex items-center">
                  <Swatch
                    color={i < 10 ? CATEGORY_COLORS[i % CATEGORY_COLORS.length] : undefined}
                  />
                  {r.label}
                </span>
              ),
            },
            {
              label: t('rep.col.group'),
              cell: (r) => <span className="text-text-secondary">{r.groupName ?? '—'}</span>,
            },
            {
              label: t('rep.col.spent'),
              align: 'right',
              cell: (r) => formatCurrency(r.totalSpent),
            },
            {
              label: t('rep.col.monthlyAverage'),
              align: 'right',
              cell: (r) => formatCurrency(Math.round(r.totalSpent / months)),
            },
            {
              label: t('rep.col.share'),
              align: 'right',
              cell: (r) => <ShareBar part={r.totalSpent} whole={total} />,
            },
          ]}
          footer={[
            {
              label: t('rep.col.total'),
              cells: [
                '',
                formatCurrency(total),
                formatCurrency(Math.round(total / months)),
                formatPercent(1),
              ],
            },
          ]}
        />
      }
    />
  );
}

/** Pick up to MAX_TREND_CATEGORIES spending categories, or go back to the biggest ones. */
function TrendCategoryPicker({
  value,
  auto,
  onChange,
}: {
  value: string[];
  auto: boolean;
  onChange: (ids: string[] | undefined) => void;
}) {
  const showIcons = usePreferencesStore((s) => s.showCategoryIcons);
  const { data: groups = [] } = useCategories();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const expenseGroups = groups.filter((g) => g.isIncome === 0 && g.categories.length);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function toggle(id: string) {
    const next = value.includes(id) ? value.filter((x) => x !== id) : [...value, id];
    onChange(next.length ? next : undefined);
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <Button variant="secondary" size="sm" onClick={() => setOpen(!open)}>
        {t('rep.trends.picker', { count: value.length })} <ChevronDown size={12} />
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 max-h-[60vh] overflow-y-auto bg-surface rounded-md border border-border shadow-hover z-30 py-1">
          <button
            onClick={() => onChange(undefined)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-hover transition-colors cursor-pointer"
          >
            <span>
              <span className="block text-sm text-text">{t('rep.trends.biggest')}</span>
              <span className="block text-xs text-text-tertiary">
                {t('rep.trends.biggestHint', { count: TOP_TREND_CATEGORIES })}
              </span>
            </span>
            {auto && <Check size={14} className="text-brand-600 shrink-0" />}
          </button>
          <div className="border-t border-border-light my-1" />
          <p className="px-3 pt-1 pb-1 text-[11px] text-text-tertiary">
            {t('rep.trends.chooseUpTo', { count: MAX_TREND_CATEGORIES })}
          </p>
          {expenseGroups.map((g) => (
            <div key={g.id}>
              <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                {g.name}
              </p>
              {g.categories.map((c) => {
                const checked = value.includes(c.id);
                const full = !checked && value.length >= MAX_TREND_CATEGORIES;
                return (
                  <label
                    key={c.id}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm ${
                      full
                        ? 'text-text-disabled cursor-not-allowed'
                        : 'text-text-secondary hover:bg-hover cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={full}
                      onChange={() => toggle(c.id)}
                      className="accent-brand-600"
                    />
                    {categoryLabel(c, showIcons)}
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SpendingTrendsDetail({
  from,
  to,
  categoryIds,
  onCategoryIdsChange,
}: DetailProps & {
  categoryIds: string[] | undefined;
  onCategoryIdsChange: (ids: string[] | undefined) => void;
}) {
  const showIcons = usePreferencesStore((s) => s.showCategoryIcons);
  const top = useTopSpendingCategories(from, to, TOP_TREND_CATEGORIES);
  const ids = categoryIds ?? top.ids;
  const { data: groups = [] } = useCategories();
  const { data: spending = [] } = useSpendingByCategory(from, to);
  const { data: trend = [], isLoading } = useSpendingTrends(ids, from, to);
  const months = monthCount(from, to);

  const rows = useMemo(() => {
    const byId = new Map(groups.flatMap((g) => g.categories).map((c) => [c.id, c]));
    return ids.map((id, i) => {
      const points = trend.filter((p) => p.categoryId === id);
      const total = points.reduce((s, p) => s + p.total, 0);
      const peak = points.reduce<(typeof points)[number] | null>(
        (best, p) => (!best || p.total > best.total ? p : best),
        null,
      );
      return {
        id,
        color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
        label: categoryLabel(byId.get(id), showIcons, t('rep.deletedCategory')),
        total,
        peak,
      };
    });
  }, [ids, trend, groups, showIcons]);
  const selected = rows.reduce((s, r) => s + r.total, 0);
  const allSpending = spending.reduce((s, d) => s + d.totalSpent, 0);
  const biggest = rows.reduce<(typeof rows)[number] | null>(
    (best, r) => (!best || r.total > best.total ? r : best),
    null,
  );
  const stats: StatCard[] = [
    { label: t('rep.spending.totalSpent'), value: formatCurrency(selected) },
    {
      label: t('rep.spending.monthlyAverage'),
      value: formatCurrency(Math.round(selected / months)),
    },
    { label: t('rep.trends.shareOfAll'), value: percent(selected, allSpending) },
    {
      label: t('rep.spending.biggestCategory'),
      value: biggest && biggest.total > 0 ? formatCurrency(biggest.total) : '—',
      sub: biggest && biggest.total > 0 ? biggest.label : undefined,
    },
  ];
  const auto = !categoryIds;

  return (
    <DetailLayout
      loading={top.isLoading || (ids.length > 0 && isLoading)}
      stats={stats}
      chartTitle={t('rep.trends.chartTitle')}
      chartSubtitle={
        auto
          ? ids.length === 1
            ? t('rep.trends.autoOne')
            : t('rep.trends.autoMany', { count: ids.length })
          : t('rep.trends.chosen', { count: ids.length })
      }
      chartActions={<TrendCategoryPicker value={ids} auto={auto} onChange={onCategoryIdsChange} />}
      chart={<SpendingTrendsChart from={from} to={to} categoryIds={ids} />}
      tableTitle={t('rep.trends.tableTitle')}
      onExport={() =>
        downloadCsv(
          csvName('spending-trends', from, to),
          [...trend]
            .sort((a, b) => a.month.localeCompare(b.month))
            .map((p) => ({
              [t('rep.csv.month')]: p.month,
              [t('rep.csv.category')]: rows.find((r) => r.id === p.categoryId)?.label ?? '',
              [t('rep.csv.spentMinor')]: p.total,
            })),
        )
      }
      table={
        <BreakdownTable
          rows={rows}
          rowKey={(r) => r.id}
          columns={[
            {
              label: t('rep.col.category'),
              cell: (r) => (
                <span className="inline-flex items-center">
                  <Swatch color={r.color} />
                  {r.label}
                </span>
              ),
            },
            { label: t('rep.col.spent'), align: 'right', cell: (r) => formatCurrency(r.total) },
            {
              label: t('rep.col.monthlyAverage'),
              align: 'right',
              cell: (r) => formatCurrency(Math.round(r.total / months)),
            },
            {
              label: t('rep.col.highestMonth'),
              align: 'right',
              cell: (r) =>
                r.peak ? `${formatCurrency(r.peak.total)} (${fullMonth(r.peak.month)})` : '—',
            },
            {
              label: t('rep.col.shareOfAll'),
              align: 'right',
              cell: (r) => <ShareBar part={r.total} whole={allSpending} />,
            },
          ]}
          footer={[
            {
              label: t('rep.col.total'),
              cells: [
                formatCurrency(selected),
                formatCurrency(Math.round(selected / months)),
                '',
                percent(selected, allSpending),
              ],
            },
          ]}
        />
      }
    />
  );
}

/** Transactions on one day of the calendar, counted the same way (budget accounts, no transfers). */
function DayTransactions({ day, onClose }: { day: string; onClose: () => void }) {
  const showIcons = usePreferencesStore((s) => s.showCategoryIcons);
  const { data = [], isLoading } = useTransactions({ from: day, to: day, limit: 1000 });
  const { data: accounts = [] } = useAccounts();
  const { data: groups = [] } = useCategories();
  const { data: payees = [] } = usePayees();
  const accountsById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoriesById = useMemo(
    () => new Map(groups.flatMap((g) => g.categories).map((c) => [c.id, c])),
    [groups],
  );
  const logos = useMemo(() => new Map(payees.map((p) => [p.id, p.logo])), [payees]);
  const rows = data.filter(
    (tx) => !tx.transferTransactionId && accountsById.get(tx.accountId)?.isOffBudget === 0,
  );
  const moneyIn = rows.reduce((s, tx) => s + Math.max(tx.amount, 0), 0);
  const moneyOut = rows.reduce((s, tx) => s - Math.min(tx.amount, 0), 0);

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold text-text">{formatWeekday(day, { long: true })}</h3>
          <p className="text-xs text-text-tertiary mt-0.5 tabular-nums">
            {t('rep.calendar.dayCount', { count: rows.length })}
            {moneyIn > 0 && (
              <span className="text-positive">
                {t('rep.calendar.dayIn', { amount: formatCurrency(moneyIn) })}
              </span>
            )}
            {moneyOut > 0 && (
              <span className="text-negative">
                {t('rep.calendar.dayOut', { amount: formatCurrency(moneyOut) })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label={t('common.close')}
          className="p-1.5 rounded text-text-tertiary hover:text-text-secondary hover:bg-hover transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>
      {isLoading ? (
        <div className="h-24 px-5 pb-4">
          <div className="h-full bg-surface-alt rounded animate-pulse" />
        </div>
      ) : (
        <BreakdownTable
          rows={rows}
          rowKey={(tx) => tx.id}
          columns={[
            {
              label: t('rep.col.payee'),
              cell: (tx) => (
                <span className="inline-flex items-center gap-2">
                  <PayeeIcon
                    name={tx.payeeName ?? ''}
                    logo={tx.payeeId ? logos.get(tx.payeeId) : null}
                    size="sm"
                  />
                  {tx.payeeName || (
                    <span className="text-text-tertiary">{t('rep.calendar.noPayee')}</span>
                  )}
                </span>
              ),
            },
            {
              label: t('rep.col.category'),
              cell: (tx) => (
                <span className="text-text-secondary">
                  {tx.isParent
                    ? t('rep.calendar.split', { count: tx.children?.length ?? 0 })
                    : tx.categoryId
                      ? categoryLabel(categoriesById.get(tx.categoryId), showIcons)
                      : t('rep.uncategorized')}
                </span>
              ),
            },
            {
              label: t('rep.col.account'),
              cell: (tx) => (
                <Link
                  to={`/accounts/${tx.accountId}`}
                  className="text-text-secondary hover:text-brand-600 transition-colors"
                >
                  {accountsById.get(tx.accountId)?.name ?? ''}
                </Link>
              ),
            },
            {
              label: t('rep.col.amount'),
              align: 'right',
              cell: (tx) =>
                tx.amount > 0 ? (
                  <span className="text-positive">+{formatCurrency(tx.amount)}</span>
                ) : (
                  <span className="text-text">{formatCurrency(tx.amount)}</span>
                ),
            },
          ]}
        />
      )}
    </Card>
  );
}

function CalendarDetail({ from, to }: DetailProps) {
  const { data = [], isLoading } = useDailyFlow(from, to);
  const [selected, setSelected] = useState<string | null>(null);
  const dayRef = useRef<HTMLDivElement>(null);
  const moneyIn = data.reduce((s, d) => s + d.income, 0);
  const moneyOut = data.reduce((s, d) => s + d.expenses, 0);
  const net = moneyIn - moneyOut;
  // Days so far, from the first transaction ("All time" starts years early) up to today
  const bounds = dayBounds(from, to);
  if (data.length && data[0].date > bounds.from) bounds.from = data[0].date;
  const days = Math.max(
    0,
    differenceInCalendarDays(parseISO(bounds.to), parseISO(bounds.from)) + 1,
  );
  const stats: StatCard[] = [
    { label: t('rep.calendar.moneyIn'), value: formatCurrency(moneyIn), tone: 'positive' },
    { label: t('rep.calendar.moneyOut'), value: formatCurrency(moneyOut), tone: 'negative' },
    { label: t('rep.calendar.net'), value: formatCurrency(net), tone: toneOf(net) },
    {
      label: t('rep.calendar.dailyAverageOut'),
      value: formatCurrency(days ? Math.round(moneyOut / days) : 0),
      sub: days ? t('rep.calendar.overDays', { count: days }) : undefined,
    },
  ];
  const rows = [...data].reverse();

  function select(day: string) {
    setSelected((cur) => (cur === day ? null : day));
    // Bring the day's transactions into view once they render
    requestAnimationFrame(() =>
      dayRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
    );
  }

  return (
    <DetailLayout
      loading={isLoading}
      stats={stats}
      chartTitle={t('rep.calendar.chartTitle')}
      chartSubtitle={
        monthCount(from, to) > CALENDAR_MONTHS_MAX
          ? t('rep.calendar.heatmapHint')
          : t('rep.calendar.barsHint')
      }
      chartHeight=""
      chart={<TransactionCalendar from={from} to={to} selected={selected} onSelect={select} />}
      extra={
        selected && (
          <div ref={dayRef} className="scroll-mt-4">
            <DayTransactions day={selected} onClose={() => setSelected(null)} />
          </div>
        )
      }
      tableTitle={t('rep.calendar.tableTitle')}
      onExport={() =>
        downloadCsv(
          csvName('calendar', from, to),
          data.map((d) => ({
            [t('rep.csv.date')]: d.date,
            [t('rep.csv.transactions')]: d.count,
            [t('rep.csv.moneyInMinor')]: d.income,
            [t('rep.csv.moneyOutMinor')]: d.expenses,
            [t('rep.csv.netMinor')]: d.income - d.expenses,
          })),
        )
      }
      table={
        <BreakdownTable
          rows={rows}
          rowKey={(r) => r.date}
          maxRows={31}
          selectedKey={selected}
          onRowClick={(r) => select(r.date)}
          columns={[
            { label: t('rep.col.date'), cell: (r) => formatWeekday(r.date) },
            { label: t('rep.col.transactions'), align: 'right', cell: (r) => r.count },
            { label: t('rep.col.moneyIn'), align: 'right', cell: (r) => formatCurrency(r.income) },
            {
              label: t('rep.col.moneyOut'),
              align: 'right',
              cell: (r) => formatCurrency(r.expenses),
            },
            {
              label: t('rep.col.net'),
              align: 'right',
              cell: (r) => <Signed cents={r.income - r.expenses} />,
            },
          ]}
          footer={[
            {
              label: t('rep.col.total'),
              cells: [
                data.reduce((s, d) => s + d.count, 0),
                formatCurrency(moneyIn),
                formatCurrency(moneyOut),
                <Signed cents={net} />,
              ],
            },
          ]}
        />
      }
    />
  );
}

/** The full view of a built-in report: headline figures, chart and breakdown table. */
export function ReportDetail({
  type,
  from,
  to,
  categoryIds,
  onCategoryIdsChange,
}: {
  type: BuiltinWidgetType;
  from: string;
  to: string;
  /** Spending Trends only: the chosen categories (undefined = the biggest ones) */
  categoryIds?: string[];
  onCategoryIdsChange: (ids: string[] | undefined) => void;
}) {
  switch (type) {
    case 'summary':
      return <SummaryDetail from={from} to={to} />;
    case 'net-worth':
      return <NetWorthDetail from={from} to={to} />;
    case 'income-expenses':
      return <IncomeExpensesDetail from={from} to={to} />;
    case 'spending':
      return <SpendingDetail from={from} to={to} />;
    case 'calendar':
      return <CalendarDetail from={from} to={to} />;
    case 'spending-trends':
      return (
        <SpendingTrendsDetail
          from={from}
          to={to}
          categoryIds={categoryIds}
          onCategoryIdsChange={onCategoryIdsChange}
        />
      );
  }
}
