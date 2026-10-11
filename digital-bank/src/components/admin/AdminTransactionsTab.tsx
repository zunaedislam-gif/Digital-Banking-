import { useState, useEffect } from 'react';
import { 
  ReceiptText, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../../services/api.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

export function AdminTransactionsTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminTransactions({
        search: searchQuery,
        type: typeFilter,
        status: statusFilter,
        limit: 100,
      });
      setTransactions(res.transactions || []);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      console.error('Failed to load admin transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  const copyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <ReceiptText className="w-6 h-6 text-amber-400" />
            <span>Bank-Wide Transactions Ledger</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time auditable ledger of all inter-account transfers, utility bill payments, and deposits.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 flex items-center space-x-2 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xl">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference ID, sender, recipient, or note..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </form>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          {/* Type Select */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 transition"
          >
            <option value="all">All Types</option>
            <option value="transfer_out">Transfers (Debit)</option>
            <option value="transfer_in">Transfers (Credit)</option>
            <option value="bill_payment">Bill Payments</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 transition"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Reference ID</th>
                <th className="px-5 py-3.5">Type & Category</th>
                <th className="px-5 py-3.5">Sender / Recipient</th>
                <th className="px-5 py-3.5 text-right">Amount</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading transactions ledger...</span>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <ReceiptText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No transactions found matching criteria.</p>
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const isDeposit = t.type === 'deposit' || t.type === 'transfer_in';
                  const isBill = t.type === 'bill_payment';

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      {/* Reference */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-white font-medium">{t.transactionReference}</span>
                          <button
                            onClick={() => copyRef(t.transactionReference)}
                            className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition"
                            title="Copy reference"
                          >
                            {copiedRef === t.transactionReference ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {t.description || 'Interbank movement'}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center space-x-1.5">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            isDeposit
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : isBill
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {isDeposit ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : isBill ? (
                              <Zap className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <span className="capitalize font-medium text-slate-200">
                              {t.type.replace('_', ' ')}
                            </span>
                            <div className="text-[10px] text-slate-400 capitalize">
                              {t.category || 'transfer'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sender / Recipient */}
                      <td className="px-5 py-4">
                        <div className="text-white text-xs font-medium">
                          {t.senderName ? (
                            <>
                              <span>{t.senderName}</span>
                              <span className="text-slate-500 mx-1">➔</span>
                              <span>{t.recipientName || 'External/Vendor'}</span>
                            </>
                          ) : (
                            <span>{t.recipientName || 'System Credit'}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {t.recipientAccountNumber || t.senderAccountNumber || '—'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 text-right">
                        <span className={`font-mono font-bold text-xs ${
                          isDeposit ? 'text-emerald-400' : 'text-slate-100'
                        }`}>
                          {isDeposit ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                        {t.fee > 0 && (
                          <div className="text-[10px] text-slate-500">
                            Fee: {formatCurrency(t.fee)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          t.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : t.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {t.status}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="px-5 py-4 text-right font-mono text-slate-400 text-[11px]">
                        {formatDate(t.timestamp)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Displaying {transactions.length} of {totalCount} transactions</span>
          <span>Security & Compliance Audited</span>
        </div>
      </div>
    </div>
  );
}
