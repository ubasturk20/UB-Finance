import { Router } from 'express';
import { format } from 'date-fns';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { accounts } from '../db/schema.js';
import { isAssetType } from '../utils/accountTypes.js';
import { isoDate } from '../utils/validation.js';
import { netWorthEquivalents, setAssetPrice } from '../services/assetService.js';

// Quantity-based assets (altın, döviz, fon, hisse, kripto) and what the net worth is in other
// terms. Mounted at /api (paths under /accounts/:id and /net-worth). The quantity and unit
// themselves are saved with the other account details (PUT /accounts/:id/details).

export const assetsRouter = Router();

const priceSchema = z.object({
  /** One unit's price, in the account's minor units */
  unitPrice: z.number().int().min(0).max(1e13),
  date: isoDate,
});

/** Today on this server, or `?today=` (the browser's own day, and tests) */
function todayOf(query: unknown): string {
  const parsed = isoDate.safeParse((query as Record<string, unknown> | undefined)?.today);
  return parsed.success ? parsed.data : format(new Date(), 'yyyy-MM-dd');
}

assetsRouter.post('/accounts/:id/asset-price', (req, res) => {
  const parsed = priceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const account = db.select().from(accounts).where(eq(accounts.id, req.params.id)).get();
  if (!account) return res.status(404).json({ error: 'Hesap bulunamadı' });
  if (!isAssetType(account.type)) {
    return res
      .status(422)
      .json({ error: 'Birim fiyatı yalnızca miktarla izlenen varlık hesaplarına girilebilir.' });
  }
  const result = setAssetPrice(account.id, parsed.data.unitPrice, parsed.data.date);
  if (!result.ok) {
    const error =
      result.reason === 'no_quantity'
        ? 'Önce hesabın miktarını girin.'
        : result.reason === 'too_large'
          ? 'Bu miktar ve fiyatla değer hesaplanamıyor.'
          : 'Hesap bulunamadı';
    return res.status(result.reason === 'not_found' ? 404 : 422).json({ error });
  }
  res.json({
    details: result.details,
    value: result.value,
    change: result.change,
    transactionId: result.transactionId,
  });
});

assetsRouter.get('/net-worth/equivalents', (req, res) => {
  res.json(netWorthEquivalents(todayOf(req.query)));
});
