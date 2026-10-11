import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Send, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  X, 
  Building2, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api.js';
import { Beneficiary } from '../../types/banking.js';
import { formatDate } from '../../utils/formatters.js';

interface BeneficiaryManagementPageProps {
  onTransferToBeneficiary: (accountNumber: string) => void;
}

export function BeneficiaryManagementPage({ onTransferToBeneficiary }: BeneficiaryManagementPageProps) {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Beneficiary Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [accInput, setAccInput] = useState('');
  const [nickname, setNickname] = useState('');
  const [bankName, setBankName] = useState('ZR Digital Bank');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [deletingBen, setDeletingBen] = useState<Beneficiary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchBeneficiaries = async () => {
    setLoading(true);
    try {
      const data = await api.getBeneficiaries();
      setBeneficiaries(data || []);
    } catch (err) {
      console.error('Failed to load beneficiaries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  // Debounced recipient check in Add Modal
  useEffect(() => {
    const clean = accInput.trim().toUpperCase();
    if (clean.length < 8) {
      setVerifiedName(null);
      setAddError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsVerifying(true);
      setAddError(null);
      try {
        const data = await api.lookupAccount(clean);
        setVerifiedName(data.recipientName);
        if (!nickname) {
          setNickname(data.recipientName);
        }
      } catch (err: any) {
        setVerifiedName(null);
        setAddError(err.message || 'Account number not found in ZR Digital Bank.');
      } finally {
        setIsVerifying(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [accInput]);

  const handleOpenAddModal = () => {
    setAccInput('');
    setNickname('');
    setVerifiedName(null);
    setAddError(null);
    setAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedName) {
      setAddError('Please enter a valid, verified account number before saving.');
      return;
    }

    setIsSubmitting(true);
    setAddError(null);
    try {
      const newBen = await api.addBeneficiary({
        accountNumber: accInput.trim().toUpperCase(),
        nickname: nickname.trim() || verifiedName,
        bankName,
      });

      setBeneficiaries((prev) => [...prev, newBen]);
      setAddModalOpen(false);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add beneficiary.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBen) return;
    setIsDeleting(true);
    try {
      await api.deleteBeneficiary(deletingBen.id);
      setBeneficiaries((prev) => prev.filter((b) => b.id !== deletingBen.id));
      setDeletingBen(null);
    } catch (err: any) {
      alert(err.message || 'Failed to remove beneficiary.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = (accNum: string, id: string) => {
    navigator.clipboard.writeText(accNum);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = beneficiaries.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.accountHolderName.toLowerCase().includes(q) ||
      b.nickname.toLowerCase().includes(q) ||
      b.accountNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
            TRUSTED RECIPIENTS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Beneficiary Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Save verified contacts for instant, one-click recurring transfers.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:opacity-95 transition flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Beneficiary</span>
        </button>
      </div>

      {/* Search & Counter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, nickname, or account number..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Saved Beneficiaries: <strong className="text-white font-mono">{beneficiaries.length}</strong>
        </div>
      </div>

      {/* Beneficiaries Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs">Loading verified beneficiaries...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ben) => (
            <div
              key={ben.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 shadow-xl transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-base shadow-sm">
                      {ben.accountHolderName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition">
                        {ben.nickname}
                      </h3>
                      <span className="text-[11px] text-slate-400 block">{ben.accountHolderName}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setDeletingBen(ben)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Remove beneficiary"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Account No:</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono text-emerald-400 font-bold">{ben.accountNumber}</span>
                      <button
                        onClick={() => handleCopy(ben.accountNumber, ben.id)}
                        className="p-1 rounded text-slate-400 hover:text-slate-200"
                        title="Copy account number"
                      >
                        {copiedId === ben.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Bank:</span>
                    <span className="text-slate-300 font-medium">{ben.bankName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Added:</span>
                    <span className="text-slate-400 text-[11px]">{formatDate(ben.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => onTransferToBeneficiary(ben.accountNumber)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-500 text-slate-200 hover:text-slate-950 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transfer Money</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No beneficiaries found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search
              ? 'No saved beneficiaries matched your search term.'
              : 'Add trusted friends, family, or partners to transfer funds in seconds.'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition inline-flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Your First Beneficiary</span>
          </button>
        </div>
      )}

      {/* ================= ADD BENEFICIARY MODAL ================= */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add New Beneficiary</h3>
                  <span className="text-xs text-slate-400">Verified intra-bank contact</span>
                </div>
              </div>

              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 mt-5">
              {addError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{addError}</span>
                </div>
              )}

              {/* Account Number with live verification */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Account Number</span>
                  {isVerifying && <span className="text-[10px] text-emerald-400 animate-pulse">Verifying...</span>}
                </label>
                <input
                  type="text"
                  required
                  value={accInput}
                  onChange={(e) => setAccInput(e.target.value.toUpperCase())}
                  placeholder="e.g. ZR-2083-4419"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-sm font-mono text-white placeholder-slate-500 outline-none"
                />

                {/* Verified Name Pill */}
                {verifiedName && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs animate-in fade-in">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Verified Account Holder:</span>
                      <strong className="text-white font-bold">{verifiedName}</strong>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-400 text-slate-950 uppercase">
                      MATCH FOUND
                    </span>
                  </div>
                )}
              </div>

              {/* Nickname Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Nickname / Label</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Rahim (Colleague), Landlord"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              {/* Bank Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Bank Name</label>
                <input
                  type="text"
                  readOnly
                  value={bankName}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!verifiedName || isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition disabled:opacity-40 shadow-lg shadow-emerald-500/20"
                >
                  {isSubmitting ? 'Saving...' : 'Save Beneficiary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION DIALOG ================= */}
      {deletingBen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Remove Beneficiary?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Are you sure you want to delete <strong>{deletingBen.nickname}</strong> ({deletingBen.accountNumber}) from your saved list?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBen(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition shadow-lg shadow-rose-500/20"
              >
                {isDeleting ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
