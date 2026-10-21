import { useId, useState } from 'react';
import { format } from 'date-fns';
import { Coins, Pencil, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { CurrencyInput } from '../ui/CurrencyInput';
import { AmountFields, useAmountValidity } from '../ui/amountValidity';
import { SavingPausedHint } from '../connection/SavingPausedHint';
import { useAccountDetails, useSetAssetPrice } from '../../hooks/useCreditCards';
import { useCanSave } from '../../hooks/useConnection';
import { formatMoney } from '../../utils/currency';
import { formatDay } from '../../utils/dates';
import { assetValue } from '../../utils/assets';
import { formatCount, t } from '../../i18n';
import type { Account, AccountDetails } from '../../types';

const changeTone = (change: number) =>
  change > 0 ? 'text-positive' : change < 0 ? 'text-negative' : 'text-text';

/** A stored quantity the Turkish way, exactly: "1234.5" → "1.234,5" */
export function formatQuantity(quantity: string): string {
  const [whole, frac] = quantity.split('.');
  return `${formatCount(Number(whole))}${frac ? `,${frac}` : ''}`;
}

interface Props {
  account: Account;
  /** Opens the account dialog, where the quantity and unit are entered */
  onEditDetails: () => void;
}

/** An asset's quantity × unit price, the price's day, and updating the price */
export function AssetSummary({ account, onEditDetails }: Props) {
  const { data: details } = useAccountDetails(account.id);
  const [priceOpen, setPriceOpen] = useState(false);

  if (!details || details.accountId !== account.id) {
    return (
      <section
        aria-label={t('asset.summary.title')}
        className="px-6 max-md:px-4 py-3 border-b border-border bg-surface text-xs text-text-tertiary"
      >
        {t('asset.summary.loading')}
      </section>
    );
  }

  const quantity = details.assetQuantity;
  return (
    <section
      aria-label={t('asset.summary.title')}
      className="shrink-0 px-6 max-md:px-4 py-3 border-b border-border bg-surface-alt"
    >
      {quantity === null ? (
        <EmptyState
          compact
          icon={<Coins size={20} />}
          title={t('asset.empty.title')}
          description={t('asset.empty.description')}
          actions={
            <Button size="sm" onClick={onEditDetails}>
              {t('asset.empty.action')}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Equation account={account} details={details} quantity={quantity} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setPriceOpen(true)}>
              <RefreshCw size={13} /> {t('asset.summary.updatePrice')}
            </Button>
            <Button variant="ghost" size="sm" onClick={onEditDetails}>
              <Pencil size={13} /> {t('asset.summary.editQuantity')}
            </Button>
          </div>
        </div>
      )}
      {priceOpen && quantity !== null && (
        <AssetPriceModal
          account={account}
          details={details}
          quantity={quantity}
          onClose={() => setPriceOpen(false)}
        />
      )}
    </section>
  );
}

function Equation({
  account,
  details,
  quantity,
}: {
  account: Account;
  details: AccountDetails;
  quantity: string;
}) {
  const money = (amount: number) => formatMoney(amount, account.currency);
  const unit = details.assetUnit ?? '';
  const price = details.assetUnitPrice;
  const value = price === null ? null : assetValue(quantity, price);

  return (
    <div className="min-w-0">
      <p className="text-sm font-semibold tabular-nums text-text break-words">
        {price === null || value === null
          ? t('asset.summary.noPrice', { quantity: formatQuantity(quantity), unit })
          : t('asset.summary.equation', {
              quantity: formatQuantity(quantity),
              unit,
              price: money(price),
              value: money(value),
            })}
      </p>
      {details.assetPriceDate && (
        <p className="text-xs text-text-tertiary">
          {t('asset.summary.priceDate', { date: formatDay(details.assetPriceDate) })}
        </p>
      )}
      {value !== null && value !== account.balance && (
        <p className="text-xs text-caution">
          {t('asset.summary.differs', { balance: money(account.balance) })}
        </p>
      )}
    </div>
  );
}

/** A new unit price and its day; the account's balance follows with a correction */
function AssetPriceModal({
  account,
  details,
  quantity,
  onClose,
}: {
  account: Account;
  details: AccountDetails;
  quantity: string;
  onClose: () => void;
}) {
  const [price, setPrice] = useState(details.assetUnitPrice ?? 0);
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [error, setError] = useState<string | null>(null);
  const { allValid, report } = useAmountValidity();
  const canSave = useCanSave();
  const setAssetPrice = useSetAssetPrice();
  const dateId = useId();
  const money = (amount: number) => formatMoney(amount, account.currency);

  const value = assetValue(quantity, price);
  const change = value === null ? null : value - account.balance;
  const priceLabel = t('asset.price.unitPrice', { unit: details.assetUnit ?? '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value === null || !date) return;
    setError(null);
    try {
      await setAssetPrice.mutateAsync({ accountId: account.id, data: { unitPrice: price, date } });
      onClose();
    } catch {
      setError(t('asset.price.error'));
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={t('asset.price.title')} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{priceLabel}</label>
          <AmountFields report={report}>
            <CurrencyInput
              value={price}
              onChange={setPrice}
              aria-label={priceLabel}
              currency={account.currency}
            />
          </AmountFields>
        </div>
        <div>
          <label htmlFor={dateId} className="block text-sm font-medium text-text-secondary mb-1">
            {t('asset.price.date')}
          </label>
          <input
            id={dateId}
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="block w-full rounded-md border border-border px-3 py-2 text-sm bg-surface text-text focus:outline-none focus:ring-1 focus:border-brand-600 focus:ring-brand-600"
          />
        </div>

        {value !== null && change !== null && (
          <dl className="rounded-lg border border-border-light bg-surface-alt px-3 py-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">{t('asset.price.newValue')}</dt>
              <dd className="font-semibold tabular-nums text-text">{money(value)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">{t('asset.price.change')}</dt>
              <dd className={`tabular-nums ${changeTone(change)}`}>
                {change > 0 ? '+' : ''}
                {money(change)}
              </dd>
            </div>
            <p className="mt-1 text-xs text-text-tertiary">
              {change === 0 ? t('asset.price.noChange') : t('asset.price.addsCorrection')}
            </p>
          </dl>
        )}

        {error && (
          <p role="alert" className="text-xs text-negative text-right">
            {error}
          </p>
        )}
        <SavingPausedHint className="text-right" />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={setAssetPrice.isPending || !canSave || !allValid || value === null || !date}
          >
            {setAssetPrice.isPending ? t('common.saving') : t('asset.price.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
