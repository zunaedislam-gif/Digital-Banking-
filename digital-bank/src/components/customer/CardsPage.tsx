import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Plus, 
  Sliders, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Copy, 
  Check, 
  Sparkles,
  Wifi,
  X
} from 'lucide-react';
import { api } from '../../services/api.js';
import { BankCard, CardStatus } from '../../types/banking.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

export function CardsPage() {
  const [cards, setCards] = useState<BankCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  // Modals & Action States
  const [freezeConfirmModal, setFreezeConfirmModal] = useState<{ card: BankCard; targetStatus: CardStatus } | null>(null);
  const [reportModalCard, setReportModalCard] = useState<BankCard | null>(null);
  const [limitModalCard, setLimitModalCard] = useState<BankCard | null>(null);
  const [newLimitInput, setNewLimitInput] = useState<string>('50000');
  const [newCardModalOpen, setNewCardModalOpen] = useState(false);
  const [newCardType, setNewCardType] = useState<'debit' | 'credit'>('debit');
  const [newCardNetwork, setNewCardNetwork] = useState<'visa' | 'mastercard'>('visa');

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const data = await api.getCards();
      setCards(data || []);
      if (data && data.length > 0 && !selectedCardId) {
        setSelectedCardId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load cards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const activeCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  const handleToggleFreeze = async () => {
    if (!freezeConfirmModal) return;
    setIsProcessing(true);
    try {
      const updated = await api.updateCardStatus(freezeConfirmModal.card.id, freezeConfirmModal.targetStatus);
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setFreezeConfirmModal(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update card status.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReport = async () => {
    if (!reportModalCard) return;
    setIsProcessing(true);
    try {
      const updated = await api.updateCardStatus(reportModalCard.id, 'reported');
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setReportModalCard(null);
    } catch (err: any) {
      alert(err.message || 'Failed to report card.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!limitModalCard) return;
    setIsProcessing(true);
    try {
      const updated = await api.updateCardLimit(limitModalCard.id, parseFloat(newLimitInput));
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setLimitModalCard(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update limit.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestNewCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const created = await api.requestVirtualCard({
        type: newCardType,
        network: newCardNetwork,
      });
      setCards((prev) => [...prev, created]);
      setSelectedCardId(created.id);
      setNewCardModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to issue card.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyCard = (num: string, id: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block">
            VIRTUAL CARD CONTROLS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Debit & Virtual Cards
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage spending limits, freeze cards instantly, and generate virtual payment methods.
          </p>
        </div>

        <button
          onClick={() => setNewCardModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:opacity-95 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Virtual Card</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs">Loading virtual cards...</p>
        </div>
      ) : cards.length > 0 && activeCard ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Card Visual & Card Selector Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Visual Physical-Style Card */}
            <div className={`
              relative w-full aspect-[1.586/1] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl overflow-hidden transition-all duration-300 border
              ${activeCard.status === 'frozen' 
                ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-slate-700 opacity-90' 
                : activeCard.status === 'reported'
                ? 'bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-950 border-rose-800/60'
                : 'bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border-indigo-500/30'
              }
            `}>
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

              {/* Card Top Row: Brand & Status Pill */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-white tracking-widest text-sm font-mono">
                    ZR DIGITAL BANK
                  </span>
                  <span className="text-[10px] uppercase font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/80">
                    {activeCard.type}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {activeCard.status === 'frozen' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" /> FROZEN
                    </span>
                  )}
                  {activeCard.status === 'reported' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/20 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> REPORTED LOST
                    </span>
                  )}
                  {activeCard.status === 'active' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> ACTIVE
                    </span>
                  )}
                </div>
              </div>

              {/* Card Middle Row: Chip & NFC */}
              <div className="flex items-center space-x-4 my-2 relative z-10">
                {/* Metallic Golden Chip */}
                <div className="w-12 h-9 rounded-lg bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-200 border border-amber-600/40 shadow-inner flex items-center justify-center">
                  <div className="w-8 h-5 border border-amber-800/40 rounded"></div>
                </div>
                <Wifi className="w-6 h-6 text-slate-400 rotate-90" />
              </div>

              {/* Card Number */}
              <div className="relative z-10 space-y-1">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-mono block">
                  Card Number
                </span>
                <div className="text-xl sm:text-2xl font-mono font-bold tracking-widest text-white flex items-center gap-3">
                  <span>{activeCard.cardNumber}</span>
                  <button
                    onClick={() => handleCopyCard(activeCard.cardNumber, activeCard.id)}
                    className="p-1 rounded text-slate-400 hover:text-white transition"
                    title="Copy card number"
                  >
                    {copiedId === activeCard.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Card Bottom Row: Cardholder, Expiry, Network */}
              <div className="flex items-end justify-between border-t border-slate-800/80 pt-4 relative z-10 text-xs">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">
                    Cardholder Name
                  </span>
                  <span className="font-bold text-white uppercase tracking-wider text-sm">
                    {activeCard.cardHolderName}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">
                    Valid Thru
                  </span>
                  <span className="font-mono text-slate-200 font-bold text-sm">
                    {activeCard.expiryDate}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">
                    CVV
                  </span>
                  <span className="font-mono text-slate-200 font-bold text-sm">
                    {showSensitive[activeCard.id] ? '742' : '•••'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-black text-lg tracking-wider text-blue-400 uppercase italic">
                    {activeCard.cardNetwork === 'visa' ? 'VISA' : 'Mastercard'}
                  </span>
                </div>
              </div>
            </div>

            {/* Multiple Cards Selector Tabs */}
            {cards.length > 1 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  Select Card to Manage ({cards.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {cards.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCardId(c.id)}
                      className={`p-3 rounded-2xl text-left border transition ${
                        c.id === activeCard.id
                          ? 'bg-slate-900 border-blue-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-mono text-xs block font-bold text-white">•••• {c.cardNumber.slice(-4)}</span>
                      <span className="text-[10px] text-slate-400 block capitalize">{c.cardNetwork} {c.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card Management Controls Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white">Card Security & Limits</h3>
                <span className="text-xs text-slate-400">Controls apply immediately to simulated transactions</span>
              </div>

              {/* Status Toggle (Freeze / Unfreeze) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    {activeCard.status === 'frozen' ? 'Card is Currently Frozen' : 'Card is Active'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {activeCard.status === 'frozen' 
                      ? 'No transactions can be processed while card is frozen.'
                      : 'Temporary freeze disables in-store and online payments.'}
                  </span>
                </div>

                {activeCard.status === 'frozen' ? (
                  <button
                    onClick={() => setFreezeConfirmModal({ card: activeCard, targetStatus: 'active' })}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shrink-0 flex items-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unfreeze</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setFreezeConfirmModal({ card: activeCard, targetStatus: 'frozen' })}
                    disabled={activeCard.status === 'reported'}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-slate-200 hover:text-amber-400 border border-slate-700 font-bold text-xs uppercase tracking-wider transition shrink-0 flex items-center gap-1.5 disabled:opacity-30"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Freeze</span>
                  </button>
                )}
              </div>

              {/* Daily Spend Limit */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Daily Spending Limit</span>
                  <button
                    onClick={() => {
                      setLimitModalCard(activeCard);
                      setNewLimitInput(String(activeCard.dailyLimit));
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Adjust Limit</span>
                  </button>
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {formatCurrency(activeCard.dailyLimit)}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Protects your balance against unauthorized bulk charges.
                </span>
              </div>

              {/* Toggle Sensitive CVV View */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Reveal CVV Security Code</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">3-digit simulated verification number</span>
                </div>
                <button
                  onClick={() => setShowSensitive((p) => ({ ...p, [activeCard.id]: !p[activeCard.id] }))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                >
                  {showSensitive[activeCard.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Report Lost / Stolen */}
              {activeCard.status !== 'reported' && (
                <div className="pt-2">
                  <button
                    onClick={() => setReportModalCard(activeCard)}
                    className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Report Card as Lost or Stolen</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No active cards found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You don't have any debit or virtual cards issued yet. Generate your first virtual card in seconds.
          </p>
          <button
            onClick={() => setNewCardModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs transition"
          >
            Issue Virtual Card
          </button>
        </div>
      )}

      {/* ================= FREEZE CONFIRMATION MODAL ================= */}
      {freezeConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
              freezeConfirmModal.targetStatus === 'frozen'
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}>
              {freezeConfirmModal.targetStatus === 'frozen' ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                {freezeConfirmModal.targetStatus === 'frozen' ? 'Freeze this card?' : 'Unfreeze this card?'}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {freezeConfirmModal.targetStatus === 'frozen'
                  ? `Are you sure you want to freeze card ending in ${freezeConfirmModal.card.cardNumber.slice(-4)}? Any attempted charges will be declined.`
                  : `Are you sure you want to unfreeze card ending in ${freezeConfirmModal.card.cardNumber.slice(-4)}? Normal transactions will resume immediately.`}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFreezeConfirmModal(null)}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleFreeze}
                disabled={isProcessing}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                  freezeConfirmModal.targetStatus === 'frozen'
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                {isProcessing ? 'Updating...' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= REPORT CARD MODAL ================= */}
      {reportModalCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Report Lost or Stolen</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Permanently blocks card ending in <strong>{reportModalCard.cardNumber.slice(-4)}</strong>. 
                This action is irreversible and recorded in the compliance audit log.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReportModalCard(null)}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReport}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider transition"
              >
                {isProcessing ? 'Reporting...' : 'Yes, Block Card'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADJUST LIMIT MODAL ================= */}
      {limitModalCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Update Daily Spend Limit</h3>
              <button onClick={() => setLimitModalCard(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateLimit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">Daily Limit (৳1,000 - ৳500,000)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    min="1000"
                    max="500000"
                    step="1000"
                    required
                    value={newLimitInput}
                    onChange={(e) => setNewLimitInput(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLimitModalCard(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs uppercase tracking-wider transition"
                >
                  {isProcessing ? 'Saving...' : 'Save Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ISSUE NEW VIRTUAL CARD MODAL ================= */}
      {newCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Generate Virtual Card</h3>
              </div>
              <button onClick={() => setNewCardModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestNewCard} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">Card Network</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCardNetwork('visa')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      newCardNetwork === 'visa' 
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300' 
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    VISA
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCardNetwork('mastercard')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      newCardNetwork === 'mastercard' 
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Mastercard
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">Card Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCardType('debit')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      newCardType === 'debit' 
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Debit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCardType('credit')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      newCardType === 'credit' 
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300' 
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Credit Line
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                Simulated virtual cards are tied directly to your primary ZR Savings ledger.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewCardModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition"
                >
                  {isProcessing ? 'Generating...' : 'Issue Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
