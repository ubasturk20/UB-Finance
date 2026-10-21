import { formatCurrency } from './currency';
import type {
  Rule,
  RuleAction,
  RuleCondition,
  RuleConditionField,
  RuleConditionOp,
  RuleInput,
  RuleSplitPart,
} from '../types';
import { formatDay } from './dates';
import { formatPercent, t } from '../i18n';
import { foldText } from './textFold';

const TEXT_OPS: RuleConditionOp[] = [
  'is',
  'is_not',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'one_of',
  'not_one_of',
  'regex',
  'is_empty',
  'is_not_empty',
];
const ID_OPS: RuleConditionOp[] = ['is', 'is_not', 'one_of', 'not_one_of'];

export const CONDITION_FIELDS: Array<{
  value: RuleConditionField;
  label: string;
  ops: RuleConditionOp[];
}> = [
  { value: 'payee', label: t('rules.field.payee'), ops: [...ID_OPS, 'is_empty', 'is_not_empty'] },
  { value: 'payee_name', label: t('rules.field.payeeName'), ops: TEXT_OPS },
  { value: 'imported_payee', label: t('rules.field.importedPayee'), ops: TEXT_OPS },
  { value: 'notes', label: t('rules.field.notes'), ops: TEXT_OPS },
  {
    value: 'amount',
    label: t('rules.field.amount'),
    ops: ['is', 'is_not', 'gt', 'gte', 'lt', 'lte', 'between', 'approx'],
  },
  { value: 'direction', label: t('rules.field.direction'), ops: ['is'] },
  {
    value: 'category',
    label: t('rules.field.category'),
    ops: [...ID_OPS, 'is_empty', 'is_not_empty'],
  },
  { value: 'account', label: t('rules.field.account'), ops: ID_OPS },
  { value: 'date', label: t('rules.field.date'), ops: ['is', 'before', 'after', 'between'] },
];

export const FIELD_HINTS: Partial<Record<RuleConditionField, string>> = {
  payee_name: t('rules.hint.payeeName'),
  imported_payee: t('rules.hint.importedPayee'),
  amount: t('rules.hint.amount'),
};

export function opLabel(field: RuleConditionField, op: RuleConditionOp): string {
  if (field === 'category' && op === 'is_empty') return t('rules.op.uncategorized');
  if (field === 'category' && op === 'is_not_empty') return t('rules.op.categorized');
  const labels: Record<RuleConditionOp, string> = {
    is: t('rules.op.is'),
    is_not: t('rules.op.isNot'),
    contains: t('rules.op.contains'),
    not_contains: t('rules.op.notContains'),
    starts_with: t('rules.op.startsWith'),
    ends_with: t('rules.op.endsWith'),
    regex: t('rules.op.regex'),
    one_of: t('rules.op.oneOf'),
    not_one_of: t('rules.op.notOneOf'),
    is_empty: t('rules.op.isEmpty'),
    is_not_empty: t('rules.op.isNotEmpty'),
    gt: t('rules.op.gt'),
    gte: t('rules.op.gte'),
    lt: t('rules.op.lt'),
    lte: t('rules.op.lte'),
    between: t('rules.op.between'),
    approx: t('rules.op.approx'),
    before: t('rules.op.before'),
    after: t('rules.op.after'),
  };
  return labels[op];
}

export const ACTION_TYPES: Array<{ value: RuleAction['type']; label: string }> = [
  { value: 'set_category', label: t('rules.action.setCategory') },
  { value: 'set_payee', label: t('rules.action.setPayee') },
  { value: 'set_notes', label: t('rules.action.setNotes') },
  { value: 'prepend_notes', label: t('rules.action.prependNotes') },
  { value: 'append_notes', label: t('rules.action.appendNotes') },
  { value: 'split', label: t('rules.action.split') },
];

const today = () => new Date().toISOString().slice(0, 10);
const isTextField = (f: RuleConditionField) =>
  f === 'payee_name' || f === 'imported_payee' || f === 'notes';

/** A condition with a sensible starting value, keeping the old value when it still fits */
export function makeCondition(
  field: RuleConditionField,
  op: RuleConditionOp,
  prev?: RuleCondition,
): RuleCondition {
  const compatible =
    prev && (prev.field === field || (isTextField(prev.field) && isTextField(field)));
  const old = compatible && 'value' in prev ? prev.value : undefined;
  const first = Array.isArray(old) ? old[0] : old;
  const num = typeof first === 'number' ? first : 0;
  const str = typeof first === 'string' ? first : '';

  if (op === 'is_empty' || op === 'is_not_empty') return { field, op } as RuleCondition;
  if (op === 'one_of' || op === 'not_one_of') {
    const list =
      Array.isArray(old) && typeof old[0] === 'string' ? (old as string[]) : str ? [str] : [];
    return { field, op, value: list } as RuleCondition;
  }
  switch (field) {
    case 'amount':
      return op === 'between'
        ? { field, op, value: Array.isArray(old) ? (old as [number, number]) : [num, num] }
        : ({ field, op, value: num } as RuleCondition);
    case 'direction':
      return { field, op: 'is', value: old === 'inflow' ? 'inflow' : 'outflow' };
    case 'date': {
      const d = str || today();
      return op === 'between'
        ? { field, op, value: Array.isArray(old) ? (old as [string, string]) : [d, d] }
        : ({ field, op, value: d } as RuleCondition);
    }
    default:
      return { field, op, value: str } as RuleCondition;
  }
}

export const newCondition = (): RuleCondition => ({
  field: 'payee_name',
  op: 'contains',
  value: '',
});
export const newAction = (): RuleAction => ({ type: 'set_category', value: '' });
export const newSplitPart = (kind: RuleSplitPart['kind'] = 'remainder'): RuleSplitPart => ({
  kind,
  value: kind === 'percent' ? 50 : 0,
  categoryId: null,
  notes: null,
});

export function makeAction(type: RuleAction['type'], prev?: RuleAction): RuleAction {
  if (type === 'split')
    return { type, parts: [newSplitPart('percent'), newSplitPart('remainder')] };
  const keepText =
    prev && prev.type !== 'split' && prev.type.endsWith('notes') && type.endsWith('notes');
  return { type, value: keepText ? (prev as { value: string }).value : '' } as RuleAction;
}

export function isConditionComplete(c: RuleCondition): boolean {
  if (!('value' in c)) return true;
  const v = c.value;
  if (Array.isArray(v))
    return v.length > 0 && v.every((x) => (typeof x === 'string' ? x.trim() !== '' : x >= 0));
  if (typeof v === 'number') return v >= 0;
  return v.trim() !== '';
}

function isActionComplete(a: RuleAction): boolean {
  if (a.type === 'split')
    return a.parts.length > 0 && a.parts.every((p) => p.kind !== 'percent' || p.value <= 100);
  if (a.type === 'set_notes') return true; // empty clears the notes
  return a.value.trim() !== '';
}

export function isRuleComplete(r: Pick<RuleInput, 'conditions' | 'actions'>): boolean {
  return (
    r.actions.length > 0 &&
    r.conditions.every(isConditionComplete) &&
    r.actions.every(isActionComplete)
  );
}

// ---------------------------------------------------------------------------
// Summaries

export type RuleLookups = {
  payee: (id: string) => string | undefined;
  account: (id: string) => string | undefined;
  category: (id: string) => string | undefined;
};

const quote = (s: string) => `"${s}"`;
const shortDate = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? formatDay(d) : d);

function nameOf(field: RuleConditionField, id: string, l: RuleLookups): string {
  const name =
    field === 'payee' ? l.payee(id) : field === 'account' ? l.account(id) : l.category(id);
  return name ?? t('rules.summary.deleted');
}

export function conditionText(c: RuleCondition, l: RuleLookups): string {
  const field = CONDITION_FIELDS.find((f) => f.value === c.field)?.label ?? c.field;
  if (c.field === 'direction') {
    return c.value === 'inflow' ? t('rules.summary.inflow') : t('rules.summary.outflow');
  }
  const op = opLabel(c.field, c.op);
  if (!('value' in c)) return `${field} ${op}`;
  const isId = c.field === 'payee' || c.field === 'account' || c.field === 'category';
  const one = (v: string) => (isId ? nameOf(c.field, v, l) : quote(v));

  let value: string;
  if (c.field === 'amount') {
    if (Array.isArray(c.value)) {
      const [from, to] = c.value.map((v) => formatCurrency(v));
      return t('rules.summary.between', { field, from, to });
    }
    value = formatCurrency(c.value);
  } else if (c.field === 'date') {
    if (Array.isArray(c.value)) {
      const [from, to] = c.value.map(shortDate);
      return t('rules.summary.between', { field, from, to });
    }
    value = shortDate(c.value);
  } else if (Array.isArray(c.value)) {
    value = c.value.map(one).join(', ');
  } else {
    value = c.op === 'regex' ? `/${c.value}/` : one(c.value);
  }
  return t('rules.summary.condition', { field, op, value });
}

function splitPartText(p: RuleSplitPart, l: RuleLookups): string {
  const amount =
    p.kind === 'fixed'
      ? formatCurrency(p.value)
      : p.kind === 'percent'
        ? formatPercent(p.value / 100, 2)
        : t('rules.summary.rest');
  const category = p.categoryId
    ? (l.category(p.categoryId) ?? t('rules.summary.deleted'))
    : t('txd.uncategorized');
  return t('rules.summary.splitPart', { amount, category });
}

export function actionText(a: RuleAction, l: RuleLookups): string {
  switch (a.type) {
    case 'set_category':
      return t('rules.summary.setCategory', {
        name: l.category(a.value) ?? t('rules.summary.deleted'),
      });
    case 'set_payee':
      return t('rules.summary.setPayee', {
        name: l.payee(a.value) ?? t('rules.summary.deleted'),
      });
    case 'set_notes':
      return a.value
        ? t('rules.summary.setNotes', { text: quote(a.value) })
        : t('rules.summary.clearNotes');
    case 'prepend_notes':
      return t('rules.summary.prependNotes', { text: quote(a.value) });
    case 'append_notes':
      return t('rules.summary.appendNotes', { text: quote(a.value) });
    case 'split':
      return t('rules.summary.split', {
        parts: a.parts.map((p) => splitPartText(p, l)).join(', '),
      });
  }
}

/** Plain text of a whole rule, for search */
export function ruleSearchText(r: Rule, l: RuleLookups): string {
  return foldText(
    [
      ...r.conditions.map((c) => conditionText(c, l)),
      ...r.actions.map((a) => actionText(a, l)),
    ].join(' '),
  );
}
