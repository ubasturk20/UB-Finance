// Interface text. UB-Finance is Turkish only, so there is one set of messages and no language
// switching: `t(key)` returns the Turkish text for a key. Messages live by area in ./messages
// (one file per area, so they can be edited separately); the glossary in ./glossary.md keeps
// the same English term translated the same way everywhere.
import { common } from './messages/common';
import { settings } from './messages/settings';
import { shell } from './messages/shell';

const MESSAGES = { ...common, ...shell, ...settings } as const;

export type MessageKey = keyof typeof MESSAGES;
export type MessageVars = Record<string, string | number>;

/**
 * The text for `key`, with `{name}` placeholders filled from `vars`. Numbers are written the
 * Turkish way (1.234). Turkish nouns don't change after a number ("3 işlem"), so one message
 * covers every count.
 */
export function t(key: MessageKey, vars?: MessageVars): string {
  const message: string = MESSAGES[key];
  if (!vars) return message;
  return message.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = vars[name];
    if (value === undefined) return whole;
    return typeof value === 'number' ? formatCount(value) : value;
  });
}

const counts = new Intl.NumberFormat('tr-TR');

/** A count the Turkish way: 1.234 */
export const formatCount = (n: number) => counts.format(n);

/** A percentage the Turkish way: %12,5 (`fraction` 0.125); `digits` decimals at most */
export function formatPercent(fraction: number, digits = 1): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'percent',
    maximumFractionDigits: digits,
  }).format(fraction);
}
