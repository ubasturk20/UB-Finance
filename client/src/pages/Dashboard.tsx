import { format, subMonths } from 'date-fns';
import SummaryStats from '../components/dashboard/SummaryStats';
import GettingStarted from '../components/dashboard/GettingStarted';
import BudgetProgress from '../components/dashboard/BudgetProgress';
import NetWorthMini from '../components/dashboard/NetWorthMini';
import IncomeExpensesMini from '../components/dashboard/IncomeExpensesMini';
import SpendingComparison from '../components/dashboard/SpendingComparison';
import SpendingBreakdown from '../components/dashboard/SpendingBreakdown';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import UpcomingBills from '../components/dashboard/UpcomingBills';
import UpcomingPayments from '../components/dashboard/UpcomingPayments';
import { HelpFooter } from '../components/layout/HelpFooter';

const now = new Date();
const currentMonth = format(now, 'yyyy-MM');
const sixMonthsAgo = format(subMonths(now, 5), 'yyyy-MM');

export default function Dashboard() {
  return (
    <div className="p-6 max-md:p-4 max-w-[1400px] mx-auto">
      <div className="mb-6 empty:hidden">
        <GettingStarted currentMonth={currentMonth} />
      </div>

      {/* Upcoming card and loan payments beside the net worth; hidden without such accounts */}
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0">
          <NetWorthMini />
        </div>
        <div className="lg:w-[400px] lg:shrink-0 min-w-0 empty:hidden">
          <UpcomingPayments />
        </div>
      </div>

      <div className="mt-5">
        <SummaryStats currentMonth={currentMonth} sixMonthsAgo={sixMonthsAgo} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <BudgetProgress currentMonth={currentMonth} />
        <UpcomingBills />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <IncomeExpensesMini sixMonthsAgo={sixMonthsAgo} currentMonth={currentMonth} />
        <SpendingComparison />
      </div>

      {/* Both cards take the row's height, so they line up (empty or not) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
        <div className="lg:col-span-5">
          <SpendingBreakdown currentMonth={currentMonth} />
        </div>
        <div className="lg:col-span-7">
          <RecentTransactions />
        </div>
      </div>

      <HelpFooter className="mt-4" />
    </div>
  );
}
