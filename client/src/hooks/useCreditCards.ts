import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import * as cardsApi from '../api/creditCards';

// Card details, the statement summary, installment plans, asset prices and the net worth's
// equivalents. The keys sit under ['accounts', …], so everything that refreshes accounts (every
// transaction change) refreshes them too.

const today = () => format(new Date(), 'yyyy-MM-dd');

export function useAccountDetails(accountId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['accounts', accountId, 'details'],
    queryFn: () => cardsApi.getAccountDetails(accountId!),
    enabled: !!accountId && enabled,
  });
}

export function useCardSummary(accountId: string, enabled = true) {
  const day = today();
  return useQuery({
    queryKey: ['accounts', accountId, 'card-summary', day],
    queryFn: () => cardsApi.getCardSummary(accountId, day),
    enabled,
  });
}

/** A loan's payment plan and where it stands today */
export function useLoanSchedule(accountId: string, enabled = true) {
  const day = today();
  return useQuery({
    queryKey: ['accounts', accountId, 'loan-schedule', day],
    queryFn: () => cardsApi.getLoanSchedule(accountId, day),
    enabled,
  });
}

export function useInstallments(accountId: string, enabled = true) {
  const day = today();
  return useQuery({
    queryKey: ['accounts', accountId, 'installments', day],
    queryFn: () => cardsApi.getInstallments(accountId, day),
    enabled,
  });
}

export function useSaveAccountDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, data }: { accountId: string; data: cardsApi.AccountDetailsPatch }) =>
      cardsApi.saveAccountDetails(accountId, data),
    onSuccess: (saved, { accountId }) => {
      qc.setQueryData(['accounts', accountId, 'details'], saved);
      qc.invalidateQueries({ queryKey: ['accounts', accountId] });
    },
  });
}

export function useCreateInstallment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, data }: { accountId: string; data: cardsApi.NewInstallmentPlan }) =>
      cardsApi.createInstallment(accountId, data, today()),
    onSuccess: (_, { accountId }) => qc.invalidateQueries({ queryKey: ['accounts', accountId] }),
  });
}

export function useDeleteInstallment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; accountId: string }) => cardsApi.deleteInstallment(id),
    onSuccess: (_, { accountId }) => qc.invalidateQueries({ queryKey: ['accounts', accountId] }),
  });
}

/** Saves an asset's unit price; the correction it adds changes the account and its register */
export function useSetAssetPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, data }: { accountId: string; data: AssetPriceInput }) =>
      cardsApi.setAssetPrice(accountId, data),
    onSuccess: (saved, { accountId }) => {
      qc.setQueryData(['accounts', accountId, 'details'], saved.details);
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

interface AssetPriceInput {
  unitPrice: number;
  date: string;
}

/** Net worth today in dollars, euros and grams of gold (under ['accounts'], so it follows them) */
export function useNetWorthEquivalents() {
  const day = today();
  return useQuery({
    queryKey: ['accounts', 'net-worth-equivalents', day],
    queryFn: () => cardsApi.getNetWorthEquivalents(day),
  });
}

/** Upcoming card and loan payments (under ['accounts'], so payments and details refresh it) */
export function useObligations(enabled = true) {
  const day = today();
  return useQuery({
    queryKey: ['accounts', 'obligations', day],
    queryFn: () => cardsApi.getObligations(day),
    enabled,
  });
}
