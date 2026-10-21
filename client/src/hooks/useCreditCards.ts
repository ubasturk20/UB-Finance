import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import * as cardsApi from '../api/creditCards';

// Card details, the statement summary and installment plans. The keys sit under
// ['accounts', id], so everything that refreshes accounts (every transaction change) refreshes
// them too.

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
