import { useState, useEffect } from 'react';
import { 
  Send, 
  QrCode, 
  Receipt, 
  CreditCard, 
  ReceiptText, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { BankAccount, BankCard, Transaction } from '../../types/banking.js';
import { formatCurrency, formatDate, maskAccountNumber } from '../../utils/formatters.js';
import { FinancialCharts, CategoryIcon } from './Charts.js';
import { ReceiveMoneyModal } from './ReceiveMoneyModal.js';
import { TransactionDetailsModal } from './TransactionDetailsModal.js';
import { DashboardTab } from '../layout/DashboardLayout.js';

interface CustomerDashboardProps {
  onNavigateTab: (tab: DashboardTab) => void;
  onOpenSendMoney?: () => void;
  onOpenBillPayment?: () => void;
}

export function CustomerDashboard({ onNavigateTab, onOpenSendMoney, onOpenBillPayment }: CustomerDashboardProps) {
  const { user, account, setAccount } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [card, setCard] = useState<BankCard | null>(null);
  const [analytics, setAnalytics] = useState<{
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    categoryBreakdown: { category: string; amount: number; percentage: number }[];
    monthlyTrend: { month: string; income: number; expense: number }[];
    recentTransactions: Transaction[];
  } | null>(null);

  const [maskBalance, setMaskBalance] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const loadDashboardData = async () => {
    try {
      const [accRes, analyticsRes] = await Promise.all([
        api.getMyAccount(),
        api.getAnalytics(),
      ]);

      if (accRes.account) {
        setAccount(accRes.account);
      }
      if (accRes.primaryCard) {
        setCard(accRes.primaryCard);
      }
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleCopyAccount = () => {
    if (account?.accountNumber) {
      navigator.clipboard.writeText(account.accountNumber);
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-medium">Loading live accounts & financial analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Greeting & Dashboard Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
            PORTFOLIO OVERVIEW
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {getGreeting()}, {user?.fullName}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Welcome back to your ZR Digital Bank personal banking hub.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setMaskBalance(!maskBalance)}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs"
            title={maskBalance ? 'Show balance' : 'Hide balance'}
          >
            {maskBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{maskBalance ? 'Show Balance' : 'Hide Balance'}</span>
          </button>
        </div>
      </div>

      {/* 2. Key Financial Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Available Balance Card */}
        <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/60 border border-emerald-500/20 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Primary Savings Account
              </span>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 uppercase font-semibold">
              {account?.status || 'Active'}
            </span>
          </div>

          <div className="mb-6">
            <span className="text-xs text-slate-400 font-medium block mb-1">Available Balance</span>
            <div className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tight">
              {maskBalance ? '৳ ••••••••' : formatCurrency(account?.availableBalance || 0)}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              Total Ledger Balance: {maskBalance ? '••••' : formatCurrency(account?.balance || 0)}
            </span>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Account No:</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                {account?.accountNumber || 'ZR-0000-0000'}
              </span>
              <button
                onClick={handleCopyAccount}
                className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
                title="Copy Account Number"
              >
                {copiedAcc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center space-x-2 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero-fraud protected • Deposit insurance insured</span>
            </div>
          </div>
        </div>

        {/* Debit Card Visual Preview */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800/80 to-slate-900 border border-slate-700/80 p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl"></div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-mono font-bold text-slate-300 tracking-wider">
                ZR DIGITAL CARD
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {card?.status || 'Active'}
              </span>
            </div>

            {/* Simulated Chip & Contactless */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-9 h-7 rounded-md bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-200 border border-amber-500/40 shadow-inner flex items-center justify-center">
                <div className="w-6 h-4 border border-amber-800/30 rounded-sm"></div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest">NFC ENABLED</span>
            </div>

            <div className="space-y-1 mb-4">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Card Number</span>
              <div className="font-mono text-base text-white font-bold tracking-widest">
                {card?.cardNumber || '4532 •••• •••• 8841'}
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between border-t border-slate-800/80 pt-4 text-xs">
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-mono block">Cardholder</span>
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                {card?.cardHolderName || user?.fullName}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-mono block">Expires</span>
              <span className="font-mono text-slate-200 font-bold text-[11px]">
                {card?.expiryDate || '10/30'}
              </span>
            </div>
            <div className="font-bold text-sm tracking-wider text-emerald-400 uppercase">
              {card?.cardNetwork || 'VISA'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Action Buttons */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Quick Banking Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Send Money */}
          <button
            onClick={() => {
              if (onOpenSendMoney) onOpenSendMoney();
              else onNavigateTab('send_money');
            }}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left transition group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">Send Money</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Instant transfer</span>
            </div>
          </button>

          {/* Receive Money */}
          <button
            onClick={() => setReceiveModalOpen(true)}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 text-left transition group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">Receive Money</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">QR & account details</span>
            </div>
          </button>

          {/* Pay Bills */}
          <button
            onClick={() => {
              if (onOpenBillPayment) onOpenBillPayment();
              else onNavigateTab('bills');
            }}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-left transition group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">Pay Bills</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Electricity, Net & more</span>
            </div>
          </button>

          {/* Cards */}
          <button
            onClick={() => onNavigateTab('cards')}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 text-left transition group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">Cards</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Freeze & security</span>
            </div>
          </button>

          {/* Transactions */}
          <button
            onClick={() => onNavigateTab('transactions')}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 text-left transition group flex flex-col justify-between col-span-2 sm:col-span-1"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">Transactions</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Statements & logs</span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Financial Charts (Income vs Expense & Spending by Category) */}
      {analytics && (
        <FinancialCharts
          monthlyTrend={analytics.monthlyTrend}
          categoryBreakdown={analytics.categoryBreakdown}
          totalIncome={analytics.totalIncome}
          totalExpense={analytics.totalExpense}
        />
      )}

      {/* 5. Recent Transactions Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-emerald-400" />
              Recent Transactions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live updates directly from your simulated account ledger
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {analytics?.recentTransactions && analytics.recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-6">Transaction</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {analytics.recentTransactions.map((t) => {
                  const isIncoming =
                    t.recipientUserId === user?.id ||
                    (t.recipientAccountNumber && t.recipientAccountNumber === account?.accountNumber) ||
                    t.type === 'deposit' ||
                    t.type === 'transfer_in';

                  return (
                    <tr 
                      key={t.id} 
                      onClick={() => setSelectedTxn(t)}
                      className="hover:bg-slate-800/60 transition cursor-pointer group"
                      title="Click to view official receipt"
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isIncoming 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {isIncoming ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">
                              {isIncoming ? t.senderName || 'Deposit Credit' : t.recipientName || 'External Payment'}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate max-w-xs block">
                              {t.description}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                        {formatDate(t.timestamp)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize text-[10px]">
                          <CategoryIcon category={t.category} />
                          <span>{t.category.replace('_', ' ')}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{t.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right font-mono font-bold whitespace-nowrap">
                        <span className={isIncoming ? 'text-emerald-400' : 'text-slate-200'}>
                          {isIncoming ? '+' : '-'}{formatCurrency(t.amount, t.currency)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs">
            <p>You don't have any transactions yet.</p>
            <span className="text-[11px] text-slate-600 mt-1 block">
              Send money or pay bills to start generating statements.
            </span>
          </div>
        )}
      </div>

      {/* Receive Money Modal */}
      {account && user && (
        <ReceiveMoneyModal
          isOpen={receiveModalOpen}
          onClose={() => setReceiveModalOpen(false)}
          account={account}
          user={user}
        />
      )}

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={!!selectedTxn}
        onClose={() => setSelectedTxn(null)}
        transaction={selectedTxn}
      />
    </div>
  );
}
