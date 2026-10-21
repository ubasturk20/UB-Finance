import type { AccountType } from '../../types';
import { accountTypeLabel } from '../../utils/accountTypes';
import { ACCOUNT_TYPE_COLORS } from '../../utils/transactionColors';
import { t, type MessageKey } from '../../i18n';

type Variant = AccountType | 'positive' | 'negative';

interface Props {
  variant: Variant;
  label?: string;
}

const styles: Partial<Record<Variant, string>> = {
  checking: 'bg-brand-100 text-brand-700',
  savings: 'bg-positive-subtle text-positive',
  credit: 'bg-caution-subtle text-caution',
  cash: 'bg-surface-alt text-text-secondary',
  investment: 'bg-invest-bg text-invest-text',
  positive: 'bg-positive-subtle text-positive',
  negative: 'bg-negative-subtle text-negative',
};

const labels: Partial<Record<Variant, MessageKey>> = {
  credit: 'ui.badge.credit',
  positive: 'ui.badge.positive',
  negative: 'ui.badge.negative',
};

export function Badge({ variant, label }: Props) {
  const className = styles[variant];
  const key = labels[variant];
  // Other account types get a tint of their icon color
  const color = ACCOUNT_TYPE_COLORS[variant] ?? '#6B7280';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className ?? ''}`}
      style={
        className
          ? undefined
          : { color, backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }
      }
    >
      {label ?? (key ? t(key) : accountTypeLabel(variant))}
    </span>
  );
}
