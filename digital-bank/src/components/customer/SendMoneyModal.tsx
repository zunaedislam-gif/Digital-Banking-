import { useState, useEffect } from 'react';
import { 
  Send, 
  X, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  UserCheck, 
  Receipt, 
  RotateCcw,
  Sparkles,
  Building2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { BankAccount, Transaction } from '../../types/banking.js';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';

interface SendMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (txn: Transaction) => void;
  initialRecipientAccountNumber?: string;
}

export function SendMoneyModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialRecipientAccountNumber 
}: SendMoneyModalProps) {
  const { user, account, setAccount } = useAuth();

  // Step 1: Form, Step 2: Confirmation, Step 3: Success Receipt
  const [step, setStep] = useState<'form' | 'confirm' | 'receipt'>('form');

  // Form Inputs
  const [recipientAccInput, setRecipientAccInput] = useState(initialRecipientAccountNumber || '');
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');

  // Sync initial recipient if changed when opening modal
  useEffect(() => {
    if (initialRecipientAccountNumber) {
      setRecipientAccInput(initialRecipientAccountNumber);
    }
  }, [initialRecipientAccountNumber, isOpen]);

  // Lookup state
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<{
    accountNumber: string;
    maskedAccountNumber: string;
    recipientName: string;
    bankName: string;
    accountType: string;
  } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Transfer action state
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [completedTxn, setCompletedTxn] = useState<Transaction | null>(null);

  // Quick recipient options for immediate demo convenience
  const demoRecipients = [
    { name: 'Md Rahim Uddin', number: 'ZR-2083-4419', note: 'Colleague' },
    { name: 'Nusrat Jahan', number: 'ZR-3391-7725', note: 'Design Partner' },
    { name: 'Tanvir Hasan', number: 'ZR-4812-6630', note: 'Engineering' },
    { name: 'Farhana Chowdhury', number: 'ZR-5519-3382', note: 'Consultant' },
  ];

  const quickAmounts = [1000, 5000, 10000, 25000];

  // Debounced lookup or trigger when user types account number
  useEffect(() => {
    const clean = recipientAccInput.trim();
    if (clean.length < 8) {
      setLookupResult(null);
      setLookupError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLookingUp(true);
      setLookupError(null);
      try {
        const data = await api.lookupAccount(clean);
        setLookupResult(data);
      } catch (err: any) {
        setLookupResult(null);
        setLookupError(err.message || 'Account not found in ZR Digital Bank.');
      } finally {
        setIsLookingUp(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [recipientAccInput]);

  if (!isOpen) return null;

  const handleSelectDemo = (accNum: string) => {
    setRecipientAccInput(accNum);
  };

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);

    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
      setTransferError('Please enter a valid transfer amount.');
      return;
    }

    if (!account || account.availableBalance < amount) {
      setTransferError('Insufficient balance.');
      return;
    }

    if (!lookupResult) {
      setTransferError('Please provide a valid, verified recipient account number.');
      return;
    }

    setStep('confirm');
  };

  const handleExecuteTransfer = async () => {
    if (!lookupResult || isTransferring) return;
    setIsTransferring(true);
    setTransferError(null);

    const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const res = await api.transferMoney({
        recipientAccountNumber: lookupResult.accountNumber,
        amount: parseFloat(amountInput),
        description: description.trim() || `Fund transfer to ${lookupResult.recipientName}`,
        idempotencyKey,
      });

      // Update balance in local session context
      if (account) {
        setAccount({
          ...account,
          balance: res.updatedBalance,
          availableBalance: res.updatedBalance,
        });
      }

      setCompletedTxn(res.transaction);
      setStep('receipt');
      if (onSuccess) onSuccess(res.transaction);
    } catch (err: any) {
      setTransferError(err.message || 'Transfer could not be completed.');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleResetForm = () => {
    setRecipientAccInput('');
    setAmountInput('');
    setDescription('');
    setLookupResult(null);
    setLookupError(null);
    setTransferError(null);
    setCompletedTxn(null);
    setStep('form');
  };

  const numAmount = parseFloat(amountInput) || 0;
  const isOverBalance = account ? numAmount > account.availableBalance : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {step === 'form' && 'Send Money to Account'}
                {step === 'confirm' && 'Confirm Fund Transfer'}
                {step === 'receipt' && 'Transfer Receipt'}
              </h2>
              <span className="text-xs text-slate-400">
                {step === 'form' && 'Instant intra-bank transfer with zero fees'}
                {step === 'confirm' && 'Verify details before executing transaction'}
                {step === 'receipt' && 'Transaction completed and ledger committed'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Global error banner */}
          {transferError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{transferError}</span>
            </div>
          )}

          {/* ================= STEP 1: INPUT FORM ================= */}
          {step === 'form' && (
            <form onSubmit={handleProceedToConfirm} className="space-y-4">
              {/* Account Selection Card */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
                    Source Account
                  </span>
                  <span className="text-xs font-bold text-white block">
                    ZR Savings Account ({account?.accountNumber})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Available</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 block">
                    {formatCurrency(account?.availableBalance || 0)}
                  </span>
                </div>
              </div>

              {/* Quick demo recipient pills */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" /> Quick Select Registered Customers:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {demoRecipients.map((demo) => (
                    <button
                      key={demo.number}
                      type="button"
                      onClick={() => handleSelectDemo(demo.number)}
                      className={`p-2 rounded-xl text-left border transition flex flex-col ${
                        recipientAccInput === demo.number 
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                          : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="font-semibold text-white truncate">{demo.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{demo.number}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Account Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Recipient Account Number</span>
                  {isLookingUp && (
                    <span className="text-[10px] text-emerald-400 animate-pulse">Verifying account...</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={recipientAccInput}
                    onChange={(e) => setRecipientAccInput(e.target.value.toUpperCase())}
                    placeholder="e.g. ZR-2083-4419"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-sm font-mono text-white placeholder-slate-500 outline-none"
                  />
                </div>

                {/* Recipient Verified Card */}
                {lookupResult && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs animate-in fade-in">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">{lookupResult.recipientName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {lookupResult.maskedAccountNumber} • {lookupResult.bankName}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-400 text-slate-950">
                      VERIFIED
                    </span>
                  </div>
                )}

                {/* Lookup Error */}
                {lookupError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{lookupError}</span>
                  </div>
                )}
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Amount to Send</label>
                  {isOverBalance && (
                    <span className="text-[11px] font-semibold text-rose-400">
                      Insufficient balance
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="10"
                    step="any"
                    required
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="0.00"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border text-lg font-mono font-bold text-white placeholder-slate-600 outline-none ${
                      isOverBalance ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                    }`}
                  />
                </div>

                {/* Quick amount chips */}
                <div className="flex items-center gap-1.5 pt-1">
                  {quickAmounts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmountInput(String(q))}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-white transition"
                    >
                      +{q.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Description / Note</label>
                <input
                  type="text"
                  maxLength={100}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Office lunch split, Freelance settlement"
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              {/* Continue to Confirmation Button */}
              <button
                type="submit"
                disabled={!lookupResult || numAmount <= 0 || isOverBalance}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition disabled:opacity-40 flex items-center justify-center gap-2 mt-4"
              >
                <span>Review & Confirm Transfer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ================= STEP 2: CONFIRMATION SCREEN ================= */}
          {step === 'confirm' && lookupResult && (
            <div className="space-y-5 animate-in fade-in">
              <div className="text-center py-2">
                <span className="text-xs text-slate-400 block mb-1">You are about to transfer</span>
                <div className="text-3xl font-extrabold text-white font-mono tracking-tight text-emerald-400">
                  {formatCurrency(numAmount)}
                </div>
                <span className="text-xs font-bold text-slate-300 mt-1 block">
                  Send to {lookupResult.recipientName}?
                </span>
              </div>

              {/* Transfer Details Breakdown */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Transfer From:</span>
                  <span className="text-white font-medium">{user?.fullName} ({account?.accountNumber})</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Transfer To:</span>
                  <span className="text-white font-bold">{lookupResult.recipientName}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Recipient Account:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{lookupResult.accountNumber}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Note:</span>
                  <span className="text-slate-300 italic">{description || 'Fund Transfer'}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Transfer Fee:</span>
                  <span className="font-mono text-emerald-400 font-bold">৳0.00 (Zero Fee)</span>
                </div>

                <div className="flex justify-between items-center pt-1 font-semibold text-sm">
                  <span className="text-white">Total Amount Deducted:</span>
                  <span className="font-mono text-white text-base font-bold">{formatCurrency(numAmount)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  disabled={isTransferring}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition"
                >
                  Cancel & Edit
                </button>

                <button
                  type="button"
                  onClick={handleExecuteTransfer}
                  disabled={isTransferring}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isTransferring ? 'Processing transfer...' : 'Confirm Transfer'}
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: SUCCESS RECEIPT ================= */}
          {step === 'receipt' && completedTxn && (
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              {/* Green check header */}
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Transfer Successful!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  ৳{completedTxn.amount.toLocaleString()} has been sent to {completedTxn.recipientName}.
                </p>
              </div>

              {/* Printable / Viewable Receipt Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2.5">
                <div className="flex justify-between text-slate-400">
                  <span>Transaction Reference:</span>
                  <span className="font-mono text-emerald-400 font-bold">{completedTxn.transactionReference}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Date & Time:</span>
                  <span className="text-slate-200">{formatDateTime(completedTxn.timestamp)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Recipient:</span>
                  <span className="text-white font-semibold">{completedTxn.recipientName}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Recipient Account:</span>
                  <span className="font-mono text-slate-300">{completedTxn.recipientAccountNumber}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Amount:</span>
                  <span className="font-mono text-white font-bold">{formatCurrency(completedTxn.amount)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-bold uppercase">COMPLETED</span>
                </div>

                <div className="border-t border-slate-800 pt-2 flex justify-between text-slate-400">
                  <span>New Available Balance:</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    {formatCurrency(account?.availableBalance || 0)}
                  </span>
                </div>
              </div>

              {/* Post-Transfer Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Make Another Transfer</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
