import { apiFetch } from './client';
import type {
  AccountDetails,
  AssetPriceResult,
  CardSummary,
  InstallmentPlan,
  LoanSchedule,
  NetWorthEquivalents,
} from '../types';

/**
 * Card fields (credit cards, KMH), loan fields (loans) or asset fields (investments, gold…); a
 * field left out keeps its value
 */
export type AccountDetailsPatch = Partial<Omit<AccountDetails, 'accountId' | 'updatedAt'>>;

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

export const getLoanSchedule = (accountId: string, today: string) =>
  apiFetch<LoanSchedule>(`/accounts/${accountId}/loan-schedule${todayQuery(today)}`);

export const getInstallments = (accountId: string, today: string) =>
  apiFetch<InstallmentPlan[]>(`/accounts/${accountId}/installments${todayQuery(today)}`);

export const createInstallment = (accountId: string, data: NewInstallmentPlan, today: string) =>
  apiFetch<InstallmentPlan>(`/accounts/${accountId}/installments${todayQuery(today)}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteInstallment = (id: string) =>
  apiFetch<void>(`/installments/${id}`, { method: 'DELETE' });

/** Saves an asset's unit price and brings its balance to quantity × price */
export const setAssetPrice = (accountId: string, data: { unitPrice: number; date: string }) =>
  apiFetch<AssetPriceResult>(`/accounts/${accountId}/asset-price`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getNetWorthEquivalents = (today: string) =>
  apiFetch<NetWorthEquivalents>(`/net-worth/equivalents${todayQuery(today)}`);
