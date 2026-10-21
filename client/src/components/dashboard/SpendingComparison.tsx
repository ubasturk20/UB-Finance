import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { useSpendingComparison } from '../../hooks/useReports';
import { formatCentsAxis, formatCurrency } from '../../utils/currency';
import { TrendingDown } from 'lucide-react';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { chartColors } from '../../utils/chartColors';
import { useXAxisLayout } from '../../hooks/useXAxisLayout';
import { t, type MessageKey } from '../../i18n';

type Mode =
  | 'week_vs_last_week'
  | 'month_vs_last_month'
  | 'month_vs_last_year'
  | 'month_vs_average'
  | 'year_vs_last_year';

const MODES: { value: Mode; label: string }[] = [
  { value: 'week_vs_last_week', label: t('dash.spending.weekVsLastWeek') },
  { value: 'month_vs_last_month', label: t('dash.spending.monthVsLastMonth') },
  { value: 'month_vs_last_year', label: t('dash.spending.monthVsLastYear') },
  { value: 'month_vs_average', label: t('dash.spending.monthVsAverage') },
  { value: 'year_vs_last_year', label: t('dash.spending.yearVsLastYear') },
];

/**
 * Names of the two lines. The server sends English labels, so they're written here from the
 * mode instead (null comparison: the server's own label, e.g. the same month last year).
 */
const LINE_LABELS: Record<Mode, { current: MessageKey; comparison: MessageKey | null }> = {
  week_vs_last_week: { current: 'dash.spending.thisWeek', comparison: 'dash.spending.lastWeek' },
  month_vs_last_month: {
    current: 'dash.spending.thisMonth',
    comparison: 'dash.spending.lastMonth',
  },
  month_vs_last_year: { current: 'dash.spending.thisMonth', comparison: null },
  month_vs_average: {
    current: 'dash.spending.thisMonth',
    comparison: 'dash.spending.averageMonth',
  },
  year_vs_last_year: { current: 'dash.spending.thisYear', comparison: 'dash.spending.lastYear' },
};

/** The same month last year, from today (the server's label is in English) */
function sameMonthLastYear(): string {
  const d = new Date();
  return format(new Date(d.getFullYear() - 1, d.getMonth(), 1), 'MMM yyyy');
}

/** Axis label in the budget's currency (always positive: spending is drawn upwards) */
const formatYAxis = (value: number): string => formatCentsAxis(Math.abs(value));

function ComparisonTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg shadow-hover px-3 py-2">
      <p className="text-xs text-text-tertiary mb-1">{label}</p>
      {payload.map(
        (p: any) =>
          p.value != null && (
            <p
              key={p.dataKey}
              className="text-xs font-medium"
              style={{ color: p.stroke || p.color }}
            >
              {p.name}: {formatCurrency(p.value)}
            </p>
          ),
      )}
    </div>
  );
}

export default function SpendingComparison() {
  const [mode, setMode] = useState<Mode>('month_vs_last_month');
  const { data, isLoading } = useSpendingComparison(mode);

  const chartData = useMemo(() => {
    if (!data) return [];
    const merged: Record<
      number,
      { day: number; label: string; current?: number; comparison?: number }
    > = {};

    for (let day = 1; day <= data.maxDays; day++) {
      merged[day] = { day, label: t('dash.spending.day', { day }) };
    }

    for (const pt of data.current) {
      if (merged[pt.day]) merged[pt.day].current = pt.cumulative;
    }
    for (const pt of data.comparison) {
      if (merged[pt.day]) merged[pt.day].comparison = pt.cumulative;
    }

    return Object.values(merged).sort((a, b) => a.day - b.day);
  }, [data]);

  const hasData =
    !!data &&
    (data.current.some((p) => p.cumulative !== 0) ||
      data.comparison.some((p) => p.cumulative !== 0));

  const labels = useMemo(() => chartData.map((d) => d.label), [chartData]);
  // Inset: y-axis width (50) on the left, chart margin (8) on the right
  const xAxis = useXAxisLayout({
    labels,
    kind: 'point',
    ordered: true,
    fontSize: 11,
    inset: { left: 50, right: 8 },
  });

  const lineLabels = LINE_LABELS[mode];
  const currentLabel = t(lineLabels.current);
  const comparisonLabel = lineLabels.comparison ? t(lineLabels.comparison) : sameMonthLastYear();

  if (isLoading || !data) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="h-5 w-36 bg-surface-alt rounded animate-pulse" />
          <div className="h-8 w-44 bg-surface-alt rounded animate-pulse" />
        </div>
        <div className="h-4 w-28 bg-surface-alt rounded animate-pulse mb-3" />
        <div className="h-48 bg-surface-alt rounded animate-pulse" />
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold text-text">
            {t('dash.spending.title')}{' '}
            <span className="text-text-secondary font-normal tabular-nums">
              {currentLabel.toLocaleLowerCase('tr-TR')} {formatCurrency(data.currentTotal)}
            </span>
          </h3>
        </div>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          aria-label={t('dash.spending.compare')}
          className="text-xs border border-border rounded-lg px-2 py-1.5 bg-surface text-text cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-600 min-w-0 max-w-[200px]"
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {hasData && chartData.length > 0 ? (
        <div className="mt-2" ref={xAxis.ref}>
          <ResponsiveContainer width="100%" height={192}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gSpendingCur" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.brand} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={chartColors.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false} {...xAxis.axisProps} />
              <YAxis
                tick={{ fontSize: 11, fill: chartColors.axis }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatYAxis}
                width={50}
              />
              <Tooltip content={<ComparisonTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: chartColors.axis }} />
              <Line
                type="monotone"
                dataKey="comparison"
                name={comparisonLabel}
                stroke="#9CA3AF"
                strokeWidth={1.5}
                dot={false}
                activeDot={false}
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="current"
                name={currentLabel}
                stroke={chartColors.brand}
                strokeWidth={2}
                fill="url(#gSpendingCur)"
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState
          compact
          icon={<TrendingDown size={20} />}
          title={t('dash.spending.emptyTitle')}
          description={t('dash.spending.emptyDescription')}
        />
      )}
    </Card>
  );
}
