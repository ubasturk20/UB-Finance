// UB-Finance is a Turkish app: amounts, dates, currency names and weekdays are written the
// Turkish way whatever language the browser is set to. Everything locale-dependent reads these.
import { setDefaultOptions } from 'date-fns';
import { tr } from 'date-fns/locale';

/** The language amounts, dates and currency names are written in */
export const APP_LOCALE = 'tr-TR';

/** The budget currency of a new budget */
export const DEFAULT_CURRENCY = 'TRY';

/** Weeks start on Monday (date-fns numbering: 0 = Sunday, 1 = Monday) */
export const WEEK_STARTS_ON = 1 as const;

/** Weekday names from Monday, short ("Pzt") and as one letter for narrow calendars */
export const WEEKDAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
export const WEEKDAYS_NARROW = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];

/** A date's column in a week that starts on Monday: Monday 0 … Sunday 6 */
export const weekdayIndex = (date: Date) => (date.getDay() + 6) % 7;

/**
 * Turkish month and day names and Monday weeks for every date-fns call that doesn't say
 * otherwise. Keys like `yyyy-MM-dd` are digits only, so they don't change. Called once at startup.
 */
export function applyDateLocale() {
  setDefaultOptions({ locale: tr, weekStartsOn: WEEK_STARTS_ON });
}
