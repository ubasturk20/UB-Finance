// Features that are switched at build time.
import { IS_DEMO } from '../demo/isDemo';

/**
 * Bank sync (Plaid, SimpleFIN, Enable Banking). None of them covers Turkish banks, so
 * UB-Finance hides them unless the client is built with VITE_BANK_SYNC=true (the server
 * also needs FLYBUDGET_BANK_SYNC=true, or it doesn't mount their routes). While off, no
 * bank API is ever called. The website demo keeps showing them as before (its worker
 * answers with "not in the demo").
 */
export const BANK_SYNC_ENABLED = import.meta.env.VITE_BANK_SYNC === 'true' || IS_DEMO;
