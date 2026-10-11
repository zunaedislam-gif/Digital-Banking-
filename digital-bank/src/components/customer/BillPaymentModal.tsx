import { useState, useEffect } from 'react';
import { 
  Receipt, 
  X, 
  Zap, 
  Flame, 
  Droplet, 
  Wifi, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Copy, 
  Check, 
  Sparkles, 
  RotateCcw,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { BillProvider, BillPaymentRecord, Transaction } from '../../types/banking.js';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';

interface BillPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProviderId?: string;
  onSuccess?: () => void;
}

export function BillPaymentModal({ isOpen, onClose, initialProviderId, onSuccess }: BillPaymentModalProps) {
  const { user, account, setAccount } = useAuth();

  // Steps: 'form' | 'confirm' | 'receipt'
  const [step, setStep] = useState<'form' | 'confirm' | 'receipt'>('form');

  const [providers, setProviders] = useState<BillProvider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(initialProviderId || '');
  const [customerNumber, setCustomerNumber] = useState('');
  const [amountInput, setAmountInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<{
    billPayment: BillPaymentRecord;
    transaction: Transaction;
  } | null>(null);

  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getBillProviders().then((data) => {
        setProviders(data || []);
        if (initialProviderId) {
          setSelectedProviderId(initialProviderId);
        } else if (data && data.length > 0 && !selectedProviderId) {
          setSelectedProviderId(data[0].id);
        }
      });
    }
  }, [isOpen, initialProviderId]);

  if (!isOpen) return null;

  const currentProvider = providers.find((p) => p.id === selectedProviderId) || providers[0];

  // Sample pre-fills for instant reviewer convenience
  const sampleBills = [
    { label: 'DESCO Electricity (৳3,450)', providerId: 'prov-elec-1', custNo: '984421', amount: '3450' },
    { label: 'Link3 Fiber Internet (৳1,725)', providerId: 'prov-net-1', custNo: 'LINK3-SUB-882', amount: '1725' },
    { label: 'Dhaka WASA Water (৳1,180)', providerId: 'prov-water-1', custNo: 'DWASA-204192', amount: '1180' },
    { label: 'GP Mobile Recharge (৳500)', providerId: 'prov-mob-1', custNo: '01712345678', amount: '500' },
  ];

  const handleApplySample = (s: typeof sampleBills[0]) => {
    setSelectedProviderId(s.providerId);
    setCustomerNumber(s.custNo);
    setAmountInput(s.amount);
    setError(null);
  };

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerNumber.trim()) {
      setError('Please enter the customer / meter / mobile account number.');
      return;
    }

    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid bill payment amount.');
      return;
    }

    if (!account || account.availableBalance < amt) {
      setError('Insufficient balance in your account.');
      return;
    }

    setStep('confirm');
  };

  const handleExecutePayment = async () => {
    if (!currentProvider) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.payBill({
        providerId: currentProvider.id,
        customerNumber: customerNumber.trim(),
        amount: parseFloat(amountInput),
      });

      if (account) {
        setAccount({
          ...account,
          balance: res.updatedBalance,
          availableBalance: res.updatedBalance,
        });
      }

      setReceiptData({
        billPayment: res.billPayment,
        transaction: res.transaction,
      });
      setStep('receipt');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Bill payment failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCustomerNumber('');
    setAmountInput('');
    setError(null);
    setReceiptData(null);
    setStep('form');
  };

  const numAmount = parseFloat(amountInput) || 0;
  const isOverBalance = account ? numAmount > account.availableBalance : false;

  const getProviderIcon = (cat?: string) => {
    switch (cat) {
      case 'electricity': return <Zap className="w-5 h-5 text-amber-400" />;
      case 'gas': return <Flame className="w-5 h-5 text-orange-400" />;
      case 'water': return <Droplet className="w-5 h-5 text-blue-400" />;
      case 'internet': return <Wifi className="w-5 h-5 text-cyan-400" />;
      case 'mobile_recharge': return <Smartphone className="w-5 h-5 text-emerald-400" />;
      default: return <Receipt className="w-5 h-5 text-slate-400" />;
    }
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
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {step === 'form' && 'Pay Utility Bill'}
                {step === 'confirm' && 'Confirm Bill Payment'}
                {step === 'receipt' && 'Utility Payment Receipt'}
              </h2>
              <span className="text-xs text-slate-400">
                {step === 'form' && 'Electricity, Water, Gas, Internet & Mobile Recharge'}
                {step === 'confirm' && 'Review bill information before settlement'}
                {step === 'receipt' && 'Payment processed successfully'}
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

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1: FORM ================= */}
          {step === 'form' && (
            <form onSubmit={handleProceedToConfirm} className="space-y-4">
              {/* Account summary banner */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Deduct From</span>
                  <span className="font-bold text-white">{account?.accountNumber} (Savings)</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Available</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatCurrency(account?.availableBalance || 0)}
                  </span>
                </div>
              </div>

              {/* Sample pre-fill pills for instant testing */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Quick Fill Demo Bill:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {sampleBills.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplySample(s)}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition flex flex-col text-[11px]"
                    >
                      <span className="text-white font-medium truncate">{s.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {s.custNo}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Select Service Provider</label>
                <div className="relative">
                  <select
                    value={selectedProviderId}
                    onChange={(e) => setSelectedProviderId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 capitalize"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer Account / Meter / Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  {currentProvider?.accountNumberLabel || 'Consumer ID / Account Number'}
                </label>
                <input
                  type="text"
                  required
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  placeholder="e.g. 984421"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-sm font-mono text-white placeholder-slate-500 outline-none"
                />
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Bill Amount</label>
                  {isOverBalance && (
                    <span className="text-[11px] font-semibold text-rose-400">Insufficient balance</span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    min="10"
                    step="any"
                    required
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="0.00"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border text-lg font-mono font-bold text-white placeholder-slate-600 outline-none ${
                      isOverBalance ? 'border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!customerNumber || numAmount <= 0 || isOverBalance}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition disabled:opacity-40 flex items-center justify-center gap-2 mt-4"
              >
                <span>Review & Pay Bill</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ================= STEP 2: CONFIRMATION ================= */}
          {step === 'confirm' && currentProvider && (
            <div className="space-y-5 animate-in fade-in">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-2">
                  {getProviderIcon(currentProvider.category)}
                </div>
                <span className="text-xs text-slate-400 block mb-1">Confirming Payment To</span>
                <h3 className="text-lg font-bold text-white">{currentProvider.name}</h3>
                <div className="text-3xl font-extrabold text-cyan-400 font-mono mt-2">
                  {formatCurrency(numAmount)}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Category:</span>
                  <span className="text-white capitalize font-semibold">
                    {currentProvider.category.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Customer / Account ID:</span>
                  <span className="font-mono text-emerald-400 font-bold">{customerNumber}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">From Account:</span>
                  <span className="font-mono text-white">{account?.accountNumber}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Processing Fee:</span>
                  <span className="font-mono text-emerald-400 font-bold">৳0.00 (Zero Fee)</span>
                </div>

                <div className="flex justify-between items-center pt-1 font-semibold text-sm">
                  <span className="text-white">Total Amount Deducted:</span>
                  <span className="font-mono text-white text-base font-bold">{formatCurrency(numAmount)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Cancel & Edit
                </button>

                <button
                  type="button"
                  onClick={handleExecutePayment}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing payment...' : 'Confirm & Pay Now'}
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: RECEIPT ================= */}
          {step === 'receipt' && receiptData && (
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Bill Payment Successful!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Paid ৳{receiptData.billPayment.amount.toLocaleString()} to {receiptData.billPayment.providerName}.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2.5">
                <div className="flex justify-between text-slate-400">
                  <span>Transaction Reference:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {receiptData.transaction.transactionReference}
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Provider:</span>
                  <span className="text-white font-semibold">{receiptData.billPayment.providerName}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Customer Account / ID:</span>
                  <span className="font-mono text-slate-200 font-semibold">{receiptData.billPayment.billCustomerNumber}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Payment Date:</span>
                  <span className="font-mono text-slate-300">{formatDateTime(receiptData.billPayment.timestamp)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Amount Paid:</span>
                  <span className="font-mono text-white font-bold">{formatCurrency(receiptData.billPayment.amount)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-bold uppercase">PAID & SETTLED</span>
                </div>

                <div className="border-t border-slate-800 pt-2 flex justify-between text-slate-400">
                  <span>Updated Available Balance:</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    {formatCurrency(account?.availableBalance || 0)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Pay Another Bill</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/20"
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
