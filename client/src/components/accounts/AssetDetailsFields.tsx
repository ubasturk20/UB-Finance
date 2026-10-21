import { useId } from 'react';
import type { AccountDetails } from '../../types';
import type { AccountDetailsPatch } from '../../api/creditCards';
import { quantityFromInput, UNIT_MAX_LENGTH } from '../../utils/assets';
import { t } from '../../i18n';
import { TextField, inputClass } from './CardDetailsFields';

/** Units offered while typing (any other text works too) */
export const UNIT_SUGGESTIONS = [
  'gram altın',
  'çeyrek altın',
  'yarım altın',
  'tam altın',
  'cumhuriyet altını',
  'ons',
  'adet',
  'lot',
  'pay',
  'USD',
  'EUR',
  'BTC',
];

/** The asset fields as typed (text, so "12,5" and an empty field can be told apart) */
export interface AssetForm {
  quantity: string;
  unit: string;
}

export const emptyAssetForm: AssetForm = { quantity: '', unit: '' };

/** A stored quantity as a field shows it for editing: "12.5" → "12,5" */
export const quantityToInput = (quantity: string | null) => (quantity ?? '').replace('.', ',');

/** The saved details put into the fields that are still empty (never over what was typed) */
export function fillEmptyAssetFields(form: AssetForm, details: AccountDetails): AssetForm {
  return {
    quantity: form.quantity || quantityToInput(details.assetQuantity),
    unit: form.unit || (details.assetUnit ?? ''),
  };
}

const quantityOk = (text: string) => !text.trim() || quantityFromInput(text) !== null;
const unitOk = (text: string) => text.trim().length <= UNIT_MAX_LENGTH;

/** What to save (an empty field clears it); null while a field can't be read */
export function assetFormPatch(form: AssetForm): AccountDetailsPatch | null {
  if (!quantityOk(form.quantity) || !unitOk(form.unit)) return null;
  return {
    assetQuantity: form.quantity.trim() ? quantityFromInput(form.quantity) : null,
    assetUnit: form.unit.trim() || null,
  };
}

interface Props {
  value: AssetForm;
  onChange: (value: AssetForm) => void;
}

/** "Miktar bilgileri" in the account dialog: how much is held, and in what unit */
export function AssetDetailsFields({ value, onChange }: Props) {
  const set = (patch: Partial<AssetForm>) => onChange({ ...value, ...patch });
  const unitId = useId();
  const listId = `${unitId}-units`;
  const badUnit = !unitOk(value.unit);
  return (
    <fieldset className="space-y-3 rounded-lg border border-border-light p-3">
      <legend className="px-1 text-sm font-semibold text-text">{t('asset.details.title')}</legend>
      <p className="text-xs text-text-tertiary">{t('asset.details.hint')}</p>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label={t('asset.details.quantity')}
          value={value.quantity}
          onChange={(quantity) => set({ quantity })}
          invalid={!quantityOk(value.quantity)}
          error={t('asset.details.badQuantity')}
          placeholder={t('asset.details.quantityPlaceholder')}
          inputMode="decimal"
        />
        <div className="min-w-0">
          <label htmlFor={unitId} className="block text-sm font-medium text-text-secondary mb-1">
            {t('asset.details.unit')}
          </label>
          <input
            id={unitId}
            type="text"
            list={listId}
            value={value.unit}
            onChange={(e) => set({ unit: e.target.value })}
            placeholder={t('asset.details.unitPlaceholder')}
            maxLength={UNIT_MAX_LENGTH + 10}
            aria-invalid={badUnit || undefined}
            aria-describedby={badUnit ? `${unitId}-error` : undefined}
            className={inputClass(badUnit)}
          />
          <datalist id={listId}>
            {UNIT_SUGGESTIONS.map((unit) => (
              <option key={unit} value={unit} />
            ))}
          </datalist>
          {badUnit && (
            <p id={`${unitId}-error`} role="alert" className="mt-1 text-xs text-negative">
              {t('asset.details.badUnit')}
            </p>
          )}
        </div>
      </div>
    </fieldset>
  );
}
