import { Router } from 'express';
import { format } from 'date-fns';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { accounts, transactions } from '../db/schema.js';
import { isCardType, isLoanType } from '../utils/accountTypes.js';
import { isoDate, isoMonth } from '../utils/validation.js';
import {
  cardSummaryFor,
  createInstallmentPlan,
  deleteInstallmentPlan,
  getDetails,
  listInstallments,
  saveDetails,
} from '../services/creditCardService.js';
import { loanScheduleFor } from '../services/loanService.js';

// Credit card details, statement summary and installment purchases (Turkish cards), and loan
// details with their payment plan (ihtiyaç/konut/taşıt/eğitim kredisi).
// Mounted at /api (paths under /accounts/:id and /installments/:id).

export const creditCardsRouter = Router();

const NOT_A_CARD =
  'Kart bilgileri yalnızca kredi kartı ve kredili mevduat hesaplarına girilebilir.';

const NOT_A_LOAN =
  'Kredi bilgileri yalnızca kredi hesaplarına (ihtiyaç, konut, taşıt, eğitim) girilebilir.';

const day = z.number().int().min(1).max(31);
const basisPoints = z.number().int().min(0).max(10_000);

// No defaults: every field is optional, and one left out keeps what was saved
const detailsSchema = z
  .object({
    creditLimit: z.number().int().min(0).max(1e13).nullable(),
    statementDay: day.nullable(),
    dueDay: day.nullable(),
    minPaymentRate: basisPoints.nullable(),
    interestRate: basisPoints.nullable(),
    loanPrincipal: z.number().int().min(0).max(1e13).nullable(),
    loanRate: basisPoints.nullable(),
    loanTerm: z.number().int().min(1).max(360).nullable(),
    loanFirstPayment: isoDate.nullable(),
    loanBsmvRate: basisPoints.nullable(),
    loanKkdfRate: basisPoints.nullable(),
  })
  .partial();

const CARD_FIELDS = ['creditLimit', 'statementDay', 'dueDay', 'minPaymentRate', 'interestRate'];
const LOAN_FIELDS = [
  'loanPrincipal',
  'loanRate',
  'loanTerm',
  'loanFirstPayment',
  'loanBsmvRate',
  'loanKkdfRate',
];

const installmentSchema = z.object({
  description: z.string().trim().min(1).max(200),
  totalAmount: z.number().int().min(1).max(1e13),
  installmentCount: z.number().int().min(2).max(36),
  firstMonth: isoMonth,
  transactionId: z.string().min(1).max(64).nullable().optional(),
});

/** Today on this server, or `?today=` (the browser's own day, and tests) */
function todayOf(query: unknown): string {
  const parsed = isoDate.safeParse((query as Record<string, unknown> | undefined)?.today);
  return parsed.success ? parsed.data : format(new Date(), 'yyyy-MM-dd');
}

function findAccount(id: string) {
  return db.select().from(accounts).where(eq(accounts.id, id)).get();
}

creditCardsRouter.get('/accounts/:id/details', (req, res) => {
  const account = findAccount(req.params.id);
  if (!account) return res.status(404).json({ error: 'Hesap bulunamadı' });
  res.json(getDetails(account.id));
});

creditCardsRouter.put('/accounts/:id/details', (req, res) => {
  const parsed = detailsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const account = findAccount(req.params.id);
  if (!account) return res.status(404).json({ error: 'Hesap bulunamadı' });
  // Card fields only on cards, loan fields only on loans; other accounts have no details
  const sent = Object.keys(parsed.data);
  const isCard = isCardType(account.type);
  const isLoan = isLoanType(account.type);
  if (!isCard && !isLoan) return res.status(422).json({ error: NOT_A_CARD });
  if (!isCard && sent.some((key) => CARD_FIELDS.includes(key))) {
    return res.status(422).json({ error: NOT_A_CARD });
  }
  if (!isLoan && sent.some((key) => LOAN_FIELDS.includes(key))) {
    return res.status(422).json({ error: NOT_A_LOAN });
  }
  res.json(saveDetails(account.id, parsed.data));
});

creditCardsRouter.get('/accounts/:id/loan-schedule', (req, res) => {
  const loan = loanScheduleFor(req.params.id, todayOf(req.query));
  if (!loan) return res.status(404).json({ error: 'Hesap bulunamadı' });
  res.json(loan);
});

creditCardsRouter.get('/accounts/:id/card-summary', (req, res) => {
  const summary = cardSummaryFor(req.params.id, todayOf(req.query));
  if (!summary) return res.status(404).json({ error: 'Hesap bulunamadı' });
  res.json(summary);
});

creditCardsRouter.get('/accounts/:id/installments', (req, res) => {
  const account = findAccount(req.params.id);
  if (!account) return res.status(404).json({ error: 'Hesap bulunamadı' });
  res.json(listInstallments(account.id, todayOf(req.query)));
});

creditCardsRouter.post('/accounts/:id/installments', (req, res) => {
  const parsed = installmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const account = findAccount(req.params.id);
  if (!account) return res.status(404).json({ error: 'Hesap bulunamadı' });
  if (!isCardType(account.type)) {
    return res
      .status(422)
      .json({ error: 'Taksitli alışveriş yalnızca kredi kartı ve KMH hesaplarına eklenebilir.' });
  }
  const txId = parsed.data.transactionId;
  if (txId) {
    const tx = db.select().from(transactions).where(eq(transactions.id, txId)).get();
    if (!tx || tx.accountId !== account.id) {
      return res.status(422).json({ error: 'Harcama bu kartta bulunamadı.' });
    }
  }
  res.status(201).json(createInstallmentPlan(account.id, parsed.data, todayOf(req.query)));
});

creditCardsRouter.delete('/installments/:id', (req, res) => {
  if (!deleteInstallmentPlan(req.params.id)) {
    return res.status(404).json({ error: 'Taksit planı bulunamadı' });
  }
  res.status(204).send();
});
