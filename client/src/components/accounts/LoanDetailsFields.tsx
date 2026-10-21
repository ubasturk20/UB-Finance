import { CurrencyInput } from '../ui/CurrencyInput';
import type { AccountDetails } from '../../types';
import type { AccountDetailsPatch } from '../../api/creditCards';
import { parsePercent, percentToInput } from '../../utils/percent';
import { defaultLoanTaxBp } from '../../utils/accountTypes';
import { formatPercent, t } from '../../i18n';
import { TextField } from './CardDetailsFields';

/** The loan fields as typed (text, so "3,49" and an empty field can be told apart) */
export interface LoanForm {
  /** In the account's minor units; 0 = not entered */
  principal: number;
  rate: string;
  term: string;
  /** yyyy-MM-dd from the date field, or empty */
  firstPayment: string;
  bsmv: string;
  kkdf: string;
}

export const emptyLoanForm: LoanForm = {
  principal: 0,
  rate: '',
  term: '',
  firstPayment: '',
  bsmv: '',
  kkdf: '',
};

/** The saved details put into the fields that are still empty (never over what was typed) */
export function fillEmptyLoanFields(form: LoanForm, details: AccountDetails): LoanForm {
  return {
    principal: form.principal || details.loanPrincipal || 0,
    rate: form.rate || percentToInput(details.loanRate),
    term: form.term || (details.loanTerm === null ? '' : String(details.loanTerm)),
    firstPayment: form.firstPayment || (details.loanFirstPayment ?? ''),
    bsmv: form.bsmv || percentToInput(details.loanBsmvRate),
    kkdf: form.kkdf || percentToInput(details.loanKkdfRate),
  };
}

/** A term in months typed in a field (1-360); null when empty or not one */
export function parseTerm(text: string): number | null {
  if (!/^\d{1,3}$/.test(text.trim())) return null;
  const n = Number(text.trim());
  return n >= 1 && n <= 360 ? n : null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const percentOk = (text: string) => !text.trim() || parsePercent(text) !== null;
const termOk = (text: string) => !text.trim() || parseTerm(text) !== null;
const dateOk = (text: string) => !text || DATE_RE.test(text);
const percentOrNull = (text: string) => (text.trim() ? parsePercent(text) : null);

/** What to save (an empty field clears it); null while a field can't be read */
export function loanFormPatch(form: LoanForm): AccountDetailsPatch | null {
  if (![form.rate, form.bsmv, form.kkdf].every(percentOk)) return null;
  if (!termOk(form.term) || !dateOk(form.firstPayment)) return null;
  return {
    loanPrincipal: form.principal > 0 ? form.principal : null,
    loanRate: percentOrNull(form.rate),
    loanTerm: form.term.trim() ? parseTerm(form.term) : null,
    loanFirstPayment: form.firstPayment || null,
    // Left empty: the loan type's usual rate is used (shown as the placeholder)
    loanBsmvRate: percentOrNull(form.bsmv),
    loanKkdfRate: percentOrNull(form.kkdf),
  };
}

interface Props {
  value: LoanForm;
  onChange: (value: LoanForm) => void;
  /** The account's type: konut kredisi suggests no BSMV/KKDF, the others %15 */
  type: string;
  /** The account's currency (null = the budget's) */
  currency: string | null;
}

/** "Kredi bilgileri" in the account dialog: principal, rate, term, first installment, taxes */
export function LoanDetailsFields({ value, onChange, type, currency }: Props) {
  const set = (patch: Partial<LoanForm>) => onChange({ ...value, ...patch });
  const suggested = t('loan.details.taxPlaceholder', {
    rate: formatPercent(defaultLoanTaxBp(type) / 10_000, 2),
  });
  return (
    <fieldset className="space-y-3 rounded-lg border border-border-light p-3">
      <legend className="px-1 text-sm font-semibold text-text">{t('loan.details.title')}</legend>
      <p className="text-xs text-text-tertiary">{t('loan.details.hint')}</p>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {t('loan.details.principal')}
        </label>
        <CurrencyInput
          value={value.principal}
          onChange={(principal) => set({ principal })}
          aria-label={t('loan.details.principal')}
          currency={currency}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label={t('loan.details.rate')}
          value={value.rate}
          onChange={(rate) => set({ rate })}
          invalid={!percentOk(value.rate)}
          error={t('loan.details.badPercent')}
          placeholder={t('loan.details.ratePlaceholder')}
          inputMode="decimal"
        />
        <TextField
          label={t('loan.details.term')}
          value={value.term}
          onChange={(term) => set({ term })}
          invalid={!termOk(value.term)}
          error={t('loan.details.badTerm')}
          placeholder={t('loan.details.termPlaceholder')}
          inputMode="numeric"
        />
      </div>
      <div>
        <TextField
          label={t('loan.details.firstPayment')}
          value={value.firstPayment}
          onChange={(firstPayment) => set({ firstPayment })}
          invalid={!dateOk(value.firstPayment)}
          error={t('loan.details.firstPaymentHint')}
          inputMode="numeric"
          type="date"
        />
        <p className="mt-1 text-xs text-text-tertiary">{t('loan.details.firstPaymentHint')}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label={t('loan.details.bsmv')}
          value={value.bsmv}
          onChange={(bsmv) => set({ bsmv })}
          invalid={!percentOk(value.bsmv)}
          error={t('loan.details.badPercent')}
          placeholder={suggested}
          inputMode="decimal"
        />
        <TextField
          label={t('loan.details.kkdf')}
          value={value.kkdf}
          onChange={(kkdf) => set({ kkdf })}
          invalid={!percentOk(value.kkdf)}
          error={t('loan.details.badPercent')}
          placeholder={suggested}
          inputMode="decimal"
        />
      </div>
      <p className="text-xs text-text-tertiary -mt-1">{t('loan.details.taxHint')}</p>
    </fieldset>
  );
}
