import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { accounts } from '../db/schema.js';
import { defaultLoanTaxBp } from '../utils/accountTypes.js';
import { accountTransactionSum } from './balances.js';
import { getDetails, type AccountDetails } from './creditCardService.js';
import { loanSchedule, loanStatus, type LoanRow, type LoanStatus } from './loan.js';

// Database side of loan tracking (the math is in loan.ts). The details are saved with the
// card details (account_details, through creditCardService.saveDetails).

export interface LoanScheduleResponse {
  accountId: string;
  /** The account's currency (null = the budget's) */
  currency: string | null;
  /** The account's balance: negative while money is owed */
  balance: number;
  details: AccountDetails;
  /** The BSMV and KKDF used: the saved ones, or the loan type's usual ones when left empty */
  bsmvRate: number;
  kkdfRate: number;
  /** Null until the principal, rate, term and first installment are all entered */
  schedule: LoanRow[] | null;
  status: LoanStatus | null;
  today: string;
}

/** Null when there's no such account */
export function loanScheduleFor(accountId: string, today: string): LoanScheduleResponse | null {
  const account = db.select().from(accounts).where(eq(accounts.id, accountId)).get();
  if (!account) return null;
  const details = getDetails(accountId);
  const bsmvRate = details.loanBsmvRate ?? defaultLoanTaxBp(account.type);
  const kkdfRate = details.loanKkdfRate ?? defaultLoanTaxBp(account.type);
  const { loanPrincipal, loanRate, loanTerm, loanFirstPayment } = details;

  const schedule =
    loanPrincipal !== null && loanRate !== null && loanTerm !== null && loanFirstPayment !== null
      ? loanSchedule({
          principal: loanPrincipal,
          monthlyRateBp: loanRate,
          term: loanTerm,
          firstPayment: loanFirstPayment,
          bsmvBp: bsmvRate,
          kkdfBp: kkdfRate,
        })
      : null;

  return {
    accountId,
    currency: account.currency,
    balance: account.startingBalance + accountTransactionSum(accountId),
    details,
    bsmvRate,
    kkdfRate,
    schedule,
    status: schedule ? loanStatus(schedule, today) : null,
    today,
  };
}
