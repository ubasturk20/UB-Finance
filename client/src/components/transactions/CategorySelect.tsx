import { usePreferencesStore } from '../../store/preferencesStore';
import type { Account, CategoryGroup } from '../../types';
import { t } from '../../i18n';

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
  groups: CategoryGroup[];
  accounts?: Account[];
  currentAccountId?: string;
  className?: string;
  /** Replaces the field's own styling (the phone sheet uses full input styling, 16px text) */
  fieldClassName?: string;
  /** Accessible name; defaults to "Kategori" */
  label?: string;
}

export function CategorySelect({
  value,
  onChange,
  groups,
  accounts,
  currentAccountId,
  className = '',
  fieldClassName,
  label = t('txd.categoryLabel'),
}: Props) {
  const showCategoryIcons = usePreferencesStore((s) => s.showCategoryIcons);
  const transferAccounts = accounts?.filter((a) => a.id !== currentAccountId && !a.closedAt) ?? [];

  return (
    <select
      aria-label={label}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className={
        fieldClassName ??
        `block w-full bg-transparent text-sm text-text focus:outline-none ${className}`
      }
    >
      <option value="">{t('txd.uncategorized')}</option>
      {groups.map((g) => (
        <optgroup key={g.id} label={g.name}>
          {g.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {showCategoryIcons && c.icon ? `${c.icon} ` : ''}
              {c.name}
            </option>
          ))}
        </optgroup>
      ))}
      {transferAccounts.length > 0 && (
        <optgroup label={t('txd.transfer')}>
          {transferAccounts.map((a) => (
            <option key={a.id} value={`transfer:${a.id}`}>
              {t('txd.transferTo', { name: a.name })}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
