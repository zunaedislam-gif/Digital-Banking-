import { useState } from 'react';
import { 
  X, 
  ReceiptText, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Copy, 
  Check, 
  Calendar, 
  Building2, 
  ShieldCheck, 
  Share2,
  FileText
} from 'lucide-react';
import { Transaction } from '../../types/banking.js';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';
import { useAuth } from '../../context/AuthContext.js';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export function TransactionDetailsModal({ isOpen, onClose, transaction }: TransactionDetailsModalProps) {
  const { user, account } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transaction) return null;

  const isIncoming =
    transaction.recipientUserId === user?.id ||
    (transaction.recipientAccountNumber && transaction.recipientAccountNumber === account?.accountNumber) ||
    transaction.type === 'deposit' ||
    transaction.type === 'transfer_in';

  const handleCopyRef = () => {
    navigator.clipboard.writeText(transaction.transactionReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              isIncoming ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {isIncoming ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Transaction Statement</h2>
              <span className="text-xs text-slate-400">Official Electronic Banking Receipt</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Main Amount Card */}
          <div className="text-center py-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 relative overflow-hidden">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              {isIncoming ? 'Total Credit Amount' : 'Total Debit Amount'}
            </div>
            <div className={`text-4xl font-black font-mono tracking-tight ${
              isIncoming ? 'text-emerald-400' : 'text-slate-100'
            }`}>
              {isIncoming ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
            </div>

            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{transaction.status}</span>
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-slate-400 text-xs capitalize font-medium">
                {transaction.type.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Key Information Fields */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
            {/* Reference */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/70">
              <span className="text-slate-400">Transaction Reference:</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-emerald-400 font-bold">{transaction.transactionReference}</span>
                <button
                  onClick={handleCopyRef}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Copy Reference"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/70">
              <span className="text-slate-400">Timestamp:</span>
              <span className="text-slate-200 font-mono">{formatDateTime(transaction.timestamp)}</span>
            </div>

            {/* Sender */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/70">
              <span className="text-slate-400">Sender:</span>
              <div className="text-right">
                <span className="text-white font-semibold block">{transaction.senderName || 'ZR Digital Bank'}</span>
                {transaction.senderAccountNumber && (
                  <span className="text-[10px] text-slate-500 font-mono block">
                    Account: {transaction.senderAccountNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Recipient */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/70">
              <span className="text-slate-400">Recipient:</span>
              <div className="text-right">
                <span className="text-white font-semibold block">{transaction.recipientName || 'ZR Customer'}</span>
                {transaction.recipientAccountNumber && (
                  <span className="text-[10px] text-slate-500 font-mono block">
                    Account: {transaction.recipientAccountNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/70">
              <span className="text-slate-400">Category:</span>
              <span className="text-slate-200 capitalize font-medium">{transaction.category.replace('_', ' ')}</span>
            </div>

            {/* Description */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/70">
              <span className="text-slate-400">Description / Note:</span>
              <span className="text-slate-200 italic max-w-xs text-right truncate">
                {transaction.description || 'Fund Transfer'}
              </span>
            </div>

            {/* Fees */}
            <div className="flex items-center justify-between pt-1 text-slate-400">
              <span>Transaction Fee:</span>
              <span className="font-mono text-emerald-400 font-bold">৳0.00 (Zero Fee)</span>
            </div>
          </div>

          {/* Security stamp */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-3 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cryptographically sealed & recorded in the immutable ZR Digital Bank Ledger.</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center gap-3">
          <button
            onClick={handleCopyRef}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Reference Copied' : 'Copy Reference'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
