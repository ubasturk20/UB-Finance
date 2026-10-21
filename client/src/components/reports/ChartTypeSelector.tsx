import { BarChart3, LineChart, AreaChart, PieChart, Table2, Layers } from 'lucide-react';
import type { ChartType, ReportMode } from '../../types';
import { t as msg } from '../../i18n';

const MODE_LABELS: Record<ReportMode, string> = {
  total: msg('rb.mode.total'),
  time: msg('rb.mode.time'),
};

const CHART_TYPES: { id: ChartType; icon: typeof BarChart3; label: string; modes: ReportMode[] }[] =
  [
    { id: 'bar', icon: BarChart3, label: msg('rb.chart.bar'), modes: ['total', 'time'] },
    { id: 'stacked-bar', icon: Layers, label: msg('rb.chart.stackedBar'), modes: ['time'] },
    { id: 'line', icon: LineChart, label: msg('rb.chart.line'), modes: ['total', 'time'] },
    { id: 'area', icon: AreaChart, label: msg('rb.chart.area'), modes: ['total', 'time'] },
    { id: 'donut', icon: PieChart, label: msg('rb.chart.donut'), modes: ['total'] },
    { id: 'table', icon: Table2, label: msg('rb.chart.table'), modes: ['total', 'time'] },
  ];

interface Props {
  value: ChartType;
  mode: ReportMode;
  onChange: (type: ChartType) => void;
}

export default function ChartTypeSelector({ value, mode, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1">
      {CHART_TYPES.map((t) => {
        const disabled = !t.modes.includes(mode);
        const active = t.id === value;
        return (
          <button
            key={t.id}
            disabled={disabled}
            onClick={() => onChange(t.id)}
            title={
              disabled
                ? msg('rb.chart.onlyIn', {
                    chart: t.label,
                    mode: t.modes.map((m) => MODE_LABELS[m]).join(' / '),
                  })
                : t.label
            }
            className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
              active
                ? 'bg-brand-50 text-brand-700 border border-brand-200'
                : disabled
                  ? 'text-text-disabled cursor-not-allowed'
                  : 'text-text-secondary hover:bg-hover border border-transparent'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
