import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { usePreferencesStore } from '../../store/preferencesStore';
import type { CategoryGroup } from '../../types';
import { formatCount, t } from '../../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reassignTo: string) => void;
  categoryName: string;
  categoryId: string;
  transactionCount: number;
  groups: CategoryGroup[];
}

export function DeleteCategoryModal({
  isOpen,
  onClose,
  onConfirm,
  categoryName,
  categoryId,
  transactionCount,
  groups,
}: Props) {
  const showCategoryIcons = usePreferencesStore((s) => s.showCategoryIcons);
  const [reassignTo, setReassignTo] = useState('');

  function handleConfirm() {
    if (!reassignTo) return;
    onConfirm(reassignTo);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('settings.categories.deleteCategoryTitle')}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          <span className="font-medium text-text">{categoryName}</span>{' '}
          {t('settings.categories.hasTransactions')}{' '}
          <span className="font-medium text-text">{formatCount(transactionCount)}</span>{' '}
          {t('settings.categories.chooseTarget')}
        </p>
        <p className="text-xs text-caution">{t('settings.categories.budgetRemoved')}</p>
        <select
          aria-label={t('settings.categories.moveTo')}
          value={reassignTo}
          onChange={(e) => setReassignTo(e.target.value)}
          className="block w-full text-sm border border-border rounded-md px-3 py-2 bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600"
        >
          <option value="">{t('settings.categories.selectCategory')}</option>
          {groups.map((g) => (
            <optgroup key={g.id} label={g.name}>
              {g.categories
                .filter((c) => c.id !== categoryId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {showCategoryIcons && c.icon ? `${c.icon} ` : ''}
                    {c.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={!reassignTo}>
          {t('settings.categories.reassign')}
        </Button>
      </div>
    </Modal>
  );
}
