import { apiFetch } from './client';
import type { AccountDetails, CardSummary, InstallmentPlan } from '../types';

export type AccountDetailsPatch = Partial<
  Pick<
    AccountDetails,
    'creditLimit' | 'statementDay' | 'dueDay' | 'minPaymentRate' | 'interestRate'
  >
>;

export interface NewInstallmentPlan {
  description: string;
  totalAmount: number;
  installmentCount: number;
  firstMonth: string;
  transactionId?: string | null;
}

/** The browser's own day, so statements and due dates follow the user's calendar */
const todayQuery = (today: string) => `?today=${encodeURIComponent(today)}`;

export const getAccountDetails = (accountId: string) =>
  apiFetch<AccountDetails>(`/accounts/${accountId}/details`);

export const saveAccountDetails = (accountId: string, data: AccountDetailsPatch) =>
  apiFetch<AccountDetails>(`/accounts/${accountId}/details`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const getCardSummary = (accountId: string, today: string) =>
  apiFetch<CardSummary>(`/accounts/${accountId}/card-summary${todayQuery(today)}`);

export const getInstallments = (accountId: string, today: string) =>
  apiFetch<InstallmentPlan[]>(`/accounts/${accountId}/installments${todayQuery(today)}`);

export const createInstallment = (accountId: string, data: NewInstallmentPlan, today: string) =>
  apiFetch<InstallmentPlan>(`/accounts/${accountId}/installments${todayQuery(today)}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteInstallment = (id: string) =>
  apiFetch<void>(`/installments/${id}`, { method: 'DELETE' });
