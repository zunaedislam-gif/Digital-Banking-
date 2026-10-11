import { useState, useEffect } from 'react';
import { 
  ReceiptText, 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  RotateCcw,
  Clock,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Layers
} from 'lucide-react';
import { api } from '../../services/api.js';
import { Transaction } from '../../types/banking.js';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters.js';
import { useAuth } from '../../context/AuthContext.js';
import { CategoryIcon } from './Charts.js';
import { TransactionDetailsModal } from './TransactionDetailsModal.js';

export function TransactionHistoryPage() {
  const { user, account } = useAuth();

  // Query & Filter States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Data states
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<{ totalIn: number; totalOut: number; count: number }>({
    totalIn: 0,
    totalOut: 0,
    count: 0,
  });

  // Modal inspection state
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.getMyTransactions({
        search,
        type: typeFilter,
        status: statusFilter,
        dateRange: dateFilter,
        page: currentPage,
        limit: itemsPerPage,
      });

      setTransactions(data.transactions || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search, typeFilter, statusFilter, dateFilter, currentPage]);

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
    setCurrentPage(1);
  };

  // Export CSV Statement
  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = [
      'Transaction Reference',
      'Date & Time',
      'Type',
      'Category',
      'Sender',
      'Recipient',
      'Description',
      'Amount (BDT)',
      'Status',
    ];

    const rows = transactions.map((t) => [
      `"${t.transactionReference}"`,
      `"${formatDateTime(t.timestamp)}"`,
      `"${t.type}"`,
      `"${t.category}"`,
      `"${t.senderName || 'ZR Digital Bank'}"`,
      `"${t.recipientName || 'ZR Customer'}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.amount.toFixed(2)}"`,
      `"${t.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ZR_Bank_Statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Page Header & Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
            ACCOUNT STATEMENTS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Transaction History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete immutable ledger of all debits, credits, and bill payments.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white text-xs font-semibold transition flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Statement (CSV)</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Filtered Results</span>
            <span className="text-xl font-bold text-white font-mono">{summary.count} Records</span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Total Received (Credits)</span>
            <span className="text-xl font-bold text-emerald-400 font-mono">
              +{formatCurrency(summary.totalIn)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Total Spent (Debits)</span>
            <span className="text-xl font-bold text-rose-400 font-mono">
              -{formatCurrency(summary.totalOut)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by reference, sender, recipient, description, or amount..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filter: Transaction Type */}
          <div className="w-full md:w-44">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Types</option>
              <option value="transfer_in">Transfers In (Credits)</option>
              <option value="transfer_out">Transfers Out (Debits)</option>
              <option value="bill_payment">Bill Payments</option>
              <option value="deposit">Deposits</option>
            </select>
          </div>

          {/* Filter: Status */}
          <div className="w-full md:w-36">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Filter: Date Range */}
          <div className="w-full md:w-40">
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="this_month">This Month</option>
            </select>
          </div>

          {/* Reset button */}
          {(search || typeFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table Container */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs">Querying transaction ledger...</p>
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-6">Transaction ID</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Sender / Recipient</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((t) => {
                    const isIncoming =
                      t.recipientUserId === user?.id ||
                      (t.recipientAccountNumber && t.recipientAccountNumber === account?.accountNumber) ||
                      t.type === 'deposit' ||
                      t.type === 'transfer_in';

                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTxn(t)}
                        className="hover:bg-slate-800/50 cursor-pointer transition group"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2.5">
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
                              <span className="font-mono font-bold text-white group-hover:text-emerald-400 transition block">
                                {t.transactionReference}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                                {t.description}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 font-mono text-slate-300 whitespace-nowrap">
                          {formatDateTime(t.timestamp)}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="capitalize font-medium text-slate-300">
                            {t.type.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-semibold text-white block">
                            {isIncoming ? t.senderName || 'ZR Digital Bank' : t.recipientName || 'External Recipient'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {isIncoming ? t.senderAccountNumber || 'BANK-HQ' : t.recipientAccountNumber}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize text-[10px]">
                            <CategoryIcon category={t.category} />
                            <span>{t.category.replace('_', ' ')}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t.status}</span>
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right font-mono font-bold whitespace-nowrap text-sm">
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

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div>
                Showing <strong className="text-white">{transactions.length}</strong> of{' '}
                <strong className="text-white">{totalCount}</strong> transactions (Page {currentPage} of {totalPages})
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`w-8 h-8 rounded-xl font-bold transition text-xs ${
                      currentPage === pg
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-20 text-center text-slate-400 text-xs space-y-3">
            <ReceiptText className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-white">No transactions found</p>
            <p className="text-slate-500 max-w-sm mx-auto">
              {search || typeFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search filters or clearing search criteria.'
                : 'You have not performed any financial operations yet.'}
            </p>
            {(search || typeFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={!!selectedTxn}
        onClose={() => setSelectedTxn(null)}
        transaction={selectedTxn}
      />
    </div>
  );
}
