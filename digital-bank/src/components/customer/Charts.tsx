import { formatCurrency } from '../../utils/formatters.js';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon, 
  BarChart3, 
  Zap, 
  Flame, 
  Droplet, 
  Wifi, 
  Smartphone, 
  Send, 
  ShoppingBag, 
  HelpCircle 
} from 'lucide-react';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
}

interface ChartsProps {
  monthlyTrend: MonthlyData[];
  categoryBreakdown: CategoryData[];
  totalIncome: number;
  totalExpense: number;
}

export function CategoryIcon({ category }: { category: string }) {
  switch (category.toLowerCase()) {
    case 'electricity':
      return <Zap className="w-3.5 h-3.5 text-amber-400" />;
    case 'gas':
      return <Flame className="w-3.5 h-3.5 text-orange-400" />;
    case 'water':
      return <Droplet className="w-3.5 h-3.5 text-blue-400" />;
    case 'internet':
      return <Wifi className="w-3.5 h-3.5 text-cyan-400" />;
    case 'mobile_recharge':
      return <Smartphone className="w-3.5 h-3.5 text-emerald-400" />;
    case 'transfer':
      return <Send className="w-3.5 h-3.5 text-teal-400" />;
    case 'shopping':
      return <ShoppingBag className="w-3.5 h-3.5 text-pink-400" />;
    default:
      return <HelpCircle className="w-3.5 h-3.5 text-slate-400" />;
  }
}

export function FinancialCharts({ monthlyTrend, categoryBreakdown, totalIncome, totalExpense }: ChartsProps) {
  // Find max value in monthly trend to scale bars
  const maxMonthlyVal = Math.max(
    ...monthlyTrend.map((m) => Math.max(m.income, m.expense)),
    10000
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Monthly Income vs Expense Bar Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Monthly Cash Flow (Income vs Expense)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Computed from real completed transactions</p>
            </div>

            <div className="flex items-center space-x-3 text-[11px]">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></span>
                <span className="text-slate-300 font-medium">Income</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400"></span>
                <span className="text-slate-300 font-medium">Expense</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-52 w-full pt-6 flex items-end justify-between gap-2 sm:gap-4 border-b border-slate-800 pb-2">
            {monthlyTrend.map((item, idx) => {
              const incomeHeight = Math.min(Math.round((item.income / maxMonthlyVal) * 100), 100);
              const expenseHeight = Math.min(Math.round((item.expense / maxMonthlyVal) * 100), 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg text-[10px] whitespace-nowrap shadow-xl pointer-events-none z-20">
                    <span className="text-emerald-400 font-mono">+{formatCurrency(item.income)}</span>
                    <span className="text-slate-500 mx-1">|</span>
                    <span className="text-rose-400 font-mono">-{formatCurrency(item.expense)}</span>
                  </div>

                  <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-40">
                    {/* Income Bar */}
                    <div
                      style={{ height: `${Math.max(incomeHeight, 4)}%` }}
                      className="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 hover:brightness-110"
                    ></div>
                    {/* Expense Bar */}
                    <div
                      style={{ height: `${Math.max(expenseHeight, item.expense > 0 ? 4 : 0)}%` }}
                      className="w-1/2 bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-md transition-all duration-500 hover:brightness-110"
                    ></div>
                  </div>

                  {/* Month Label */}
                  <span className="text-[11px] font-medium text-slate-400 mt-2 font-mono">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Totals Summary */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-2">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Total Credits</span>
            </div>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              {formatCurrency(totalIncome)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span className="text-xs text-slate-400">Total Debits</span>
            </div>
            <span className="text-xs font-bold text-rose-400 font-mono">
              {formatCurrency(totalExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Spending by Category Breakdown */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-teal-400" />
                Spending by Category
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time expenditure classification</p>
            </div>
            <span className="text-xs font-bold text-slate-300 font-mono">
              {categoryBreakdown.length} Categories
            </span>
          </div>

          {/* Category List */}
          {categoryBreakdown.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center text-slate-500 text-xs">
              <p>No outgoing expense records recorded yet.</p>
              <span className="text-[11px] text-slate-600 mt-1">Transfers and bill payments will appear here.</span>
            </div>
          ) : (
            <div className="space-y-3.5 my-2">
              {categoryBreakdown.slice(0, 5).map((cat, idx) => {
                const colors = [
                  'bg-emerald-500',
                  'bg-teal-500',
                  'bg-cyan-500',
                  'bg-amber-500',
                  'bg-purple-500',
                ];
                const barColor = colors[idx % colors.length];

                return (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded-md bg-slate-800 border border-slate-700/60">
                          <CategoryIcon category={cat.category} />
                        </div>
                        <span className="font-semibold text-slate-200 capitalize">
                          {cat.category.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400 text-[11px] font-mono">({cat.percentage}%)</span>
                        <span className="font-bold text-white font-mono">{formatCurrency(cat.amount)}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div
                        style={{ width: `${Math.max(cat.percentage, 3)}%` }}
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Total Outflow info */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 mt-4 flex items-center justify-between text-xs">
          <span className="text-slate-400">Total Spent Across All Categories:</span>
          <span className="text-sm font-bold text-white font-mono">{formatCurrency(totalExpense)}</span>
        </div>
      </div>
    </div>
  );
}
