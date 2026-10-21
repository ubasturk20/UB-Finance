import { useId } from 'react';
import { CurrencyInput } from '../ui/CurrencyInput';
import type { AccountDetails } from '../../types';
import type { AccountDetailsPatch } from '../../api/creditCards';
import { parseDayOfMonth, parsePercent, percentToInput } from '../../utils/percent';
import { t } from '../../i18n';

/** The card fields as typed (text, so "4,25" and an empty field can be told apart) */
export interface CardForm {
  /** In the account's minor units; 0 = not entered */
  limit: number;
  statementDay: string;
  dueDay: string;
  minRate: string;
  interestRate: string;
}

export const emptyCardForm: CardForm = {
  limit: 0,
  statementDay: '',
  dueDay: '',
  minRate: '',
  interestRate: '',
};

/** The saved details put into the fields that are still empty (never over what was typed) */
export function fillEmptyCardFields(form: CardForm, details: AccountDetails): CardForm {
  const day = (n: number | null) => (n === null ? '' : String(n));
  return {
    limit: form.limit || details.creditLimit || 0,
    statementDay: form.statementDay || day(details.statementDay),
    dueDay: form.dueDay || day(details.dueDay),
    minRate: form.minRate || percentToInput(details.minPaymentRate),
    interestRate: form.interestRate || percentToInput(details.interestRate),
  };
}

const dayOk = (text: string) => !text.trim() || parseDayOfMonth(text) !== null;
const percentOk = (text: string) => !text.trim() || parsePercent(text) !== null;

/** What to save (an empty field clears it); null while a field can't be read */
export function cardFormPatch(form: CardForm): AccountDetailsPatch | null {
  if (![form.statementDay, form.dueDay].every(dayOk)) return null;
  if (![form.minRate, form.interestRate].every(percentOk)) return null;
  return {
    creditLimit: form.limit > 0 ? form.limit : null,
    statementDay: form.statementDay.trim() ? parseDayOfMonth(form.statementDay) : null,
    dueDay: form.dueDay.trim() ? parseDayOfMonth(form.dueDay) : null,
    minPaymentRate: form.minRate.trim() ? parsePercent(form.minRate) : null,
    interestRate: form.interestRate.trim() ? parsePercent(form.interestRate) : null,
  };
}

export const inputClass = (invalid: boolean) =>
  `block w-full rounded-md border px-3 py-2 text-sm bg-surface text-text placeholder-text-disabled focus:outline-none focus:ring-1 ${
    invalid
      ? 'border-negative focus:border-negative focus:ring-negative'
      : 'border-border focus:border-brand-600 focus:ring-brand-600'
  }`;

export interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  error: string;
  placeholder?: string;
  inputMode: 'numeric' | 'decimal';
  /** A native date field (yyyy-MM-dd) instead of text */
  type?: 'text' | 'date';
}

export function TextField({
  label,
  value,
  onChange,
  invalid,
  error,
  placeholder,
  inputMode,
  type = 'text',
}: FieldProps) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={type === 'text' ? inputMode : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className={inputClass(invalid)}
      />
      {invalid && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-negative">
          {error}
        </p>
      )}
    </div>
  );
}

interface Props {
  value: CardForm;
  onChange: (value: CardForm) => void;
  /** The account's currency (null = the budget's) */
  currency: string | null;
}

/** "Kart bilgileri" in the account dialog: limit, statement and due days, rates */
export function CardDetailsFields({ value, onChange, currency }: Props) {
  const set = (patch: Partial<CardForm>) => onChange({ ...value, ...patch });
  return (
    <fieldset className="space-y-3 rounded-lg border border-border-light p-3">
      <legend className="px-1 text-sm font-semibold text-text">{t('card.details.title')}</legend>
      <p className="text-xs text-text-tertiary">{t('card.details.hint')}</p>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {t('card.details.limit')}
        </label>
        <CurrencyInput
          value={value.limit}
          onChange={(limit) => set({ limit })}
          aria-label={t('card.details.limit')}
          currency={currency}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label={t('card.details.statementDay')}
          value={value.statementDay}
          onChange={(statementDay) => set({ statementDay })}
          invalid={!dayOk(value.statementDay)}
          error={t('card.details.badDay')}
          placeholder="15"
          inputMode="numeric"
        />
        <TextField
          label={t('card.details.dueDay')}
          value={value.dueDay}
          onChange={(dueDay) => set({ dueDay })}
          invalid={!dayOk(value.dueDay)}
          error={t('card.details.badDay')}
          placeholder="25"
          inputMode="numeric"
        />
      </div>
      <p className="text-xs text-text-tertiary -mt-1">{t('card.details.dayHint')}</p>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label={t('card.details.minRate')}
          value={value.minRate}
          onChange={(minRate) => set({ minRate })}
          invalid={!percentOk(value.minRate)}
          error={t('card.details.badPercent')}
          placeholder={t('card.details.ratePlaceholder')}
          inputMode="decimal"
        />
        <TextField
          label={t('card.details.interestRate')}
          value={value.interestRate}
          onChange={(interestRate) => set({ interestRate })}
          invalid={!percentOk(value.interestRate)}
          error={t('card.details.badPercent')}
          placeholder={t('card.details.interestPlaceholder')}
          inputMode="decimal"
        />
      </div>
    </fieldset>
  );
}
