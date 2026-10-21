import { ACCOUNT_GROUPS, ACCOUNT_TYPES, type AccountType } from '../../types';
import { accountTypeInfo } from '../../utils/accountTypes';
import { t } from '../../i18n';

interface Props {
  value: AccountType;
  onChange: (type: AccountType) => void;
}

/** Account type picker grouped into Cash, Credit, Investments, Property, Loans and Other */
export function AccountTypeSelect({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1">
        {t('acc.form.type')}
      </label>
      <select
        aria-label={t('acc.form.typeAria')}
        value={value}
        onChange={(e) => onChange(e.target.value as AccountType)}
        className="block w-full rounded-lg border border-border px-3 py-2 text-sm bg-surface text-text focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        {ACCOUNT_GROUPS.map((g) => (
          <optgroup key={g.value} label={g.label}>
            {ACCOUNT_TYPES.filter((a) => a.group === g.value).map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <p className="mt-1 text-xs text-text-tertiary">{accountTypeInfo(value).hint}</p>
    </div>
  );
}
