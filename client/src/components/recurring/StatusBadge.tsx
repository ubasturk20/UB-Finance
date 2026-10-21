import {
  AlertOctagon,
  AlertTriangle,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Pause,
  SkipForward,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type { OccurrenceDisplayStatus } from '../../types';
import { t } from '../../i18n';

// Occurrence statuses + schedule-level states (Actual Budget's badge scheme)
export type RecurringBadgeStatus = OccurrenceDisplayStatus | 'paused' | 'scheduled';

const BADGE: Record<RecurringBadgeStatus, { label: string; className: string; Icon: LucideIcon }> =
  {
    waiting: {
      label: t('rec.status.missed'),
      className: 'bg-negative-subtle text-negative',
      Icon: AlertOctagon,
    },
    due: {
      label: t('rec.status.due'),
      className: 'bg-caution-subtle text-caution',
      Icon: AlertTriangle,
    },
    upcoming: {
      label: t('rec.status.upcoming'),
      className: 'bg-brand-50 text-brand-600',
      Icon: CalendarDays,
    },
    paid: {
      label: t('rec.status.paid'),
      className: 'bg-positive-subtle text-positive',
      Icon: CheckCircle2,
    },
    skipped: {
      label: t('rec.status.skipped'),
      className: 'bg-surface-alt text-text-tertiary',
      Icon: SkipForward,
    },
    cancelled: {
      label: t('rec.status.canceled'),
      className: 'bg-surface-alt text-text-tertiary',
      Icon: XCircle,
    },
    paused: {
      label: t('rec.status.paused'),
      className: 'bg-caution-subtle text-caution',
      Icon: Pause,
    },
    scheduled: {
      label: t('rec.status.scheduled'),
      className: 'bg-surface-alt text-text-secondary',
      Icon: Calendar,
    },
  };

export function statusLabel(status: RecurringBadgeStatus): string {
  return BADGE[status].label;
}

export default function StatusBadge({ status }: { status: RecurringBadgeStatus }) {
  const { label, className, Icon } = BADGE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium shrink-0 ${className}`}
    >
      <Icon size={12} />
      {label}
    </span>
  );
}
