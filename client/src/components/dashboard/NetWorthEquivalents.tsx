import { useNetWorthEquivalents } from '../../hooks/useCreditCards';
import { minorUnits } from '../../utils/currencies';
import { formatDay } from '../../utils/dates';
import { t } from '../../i18n';

const whole = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
const grams = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 });

/** An amount in a currency's minor units as whole units with its code: "1.234 USD" */
const inCurrency = (value: number, currency: string) =>
  `${whole.format(value / 10 ** minorUnits(currency))} ${currency}`;

interface Item {
  key: string;
  text: string;
  title: string;
}

/**
 * Under the net worth: what it is in dollars, euros and grams of gold, each only when there's a
 * rate or a gold price to work it out ("≈ 1.234 USD · ≈ 56,7 gram altın")
 */
export function NetWorthEquivalents({ className = '' }: { className?: string }) {
  const { data } = useNetWorthEquivalents();
  if (!data) return null;

  const items: Item[] = [];
  for (const [key, found] of [
    ['USD', data.usd],
    ['EUR', data.eur],
  ] as const) {
    if (!found) continue;
    items.push({
      key,
      text: t('asset.equiv.currency', { amount: inCurrency(found.value, key) }),
      title: t('asset.equiv.rateTitle', { date: formatDay(found.rateDate) }),
    });
  }
  if (data.goldGram) {
    items.push({
      key: 'gold',
      text: t('asset.equiv.gold', { grams: grams.format(data.goldGram.value) }),
      title: t('asset.equiv.goldTitle', {
        account: data.goldGram.accountName,
        date: formatDay(data.goldGram.priceDate),
      }),
    });
  }
  if (items.length === 0) return null;

  return (
    <ul
      aria-label={t('asset.equiv.label')}
      className={`flex flex-wrap gap-x-2 text-xs tabular-nums text-text-tertiary ${className}`}
    >
      {items.map((item, i) => (
        <li key={item.key} title={item.title} className="min-w-0 break-words">
          {i > 0 && (
            <span aria-hidden className="mr-2">
              ·
            </span>
          )}
          {item.text}
        </li>
      ))}
    </ul>
  );
}
