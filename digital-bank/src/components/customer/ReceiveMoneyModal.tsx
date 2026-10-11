import { useState } from 'react';
import { X, QrCode, Copy, Check, Landmark, ShieldCheck, Share2 } from 'lucide-react';
import { BankAccount, User } from '../../types/banking.js';

interface ReceiveMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: BankAccount;
  user: User;
}

export function ReceiveMoneyModal({ isOpen, onClose, account, user }: ReceiveMoneyModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(account.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Receive Money</h3>
              <span className="text-xs text-slate-400">Share account credentials</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simulated QR Code Canvas */}
        <div className="my-6 p-6 rounded-2xl bg-white flex flex-col items-center justify-center shadow-inner">
          <div className="w-44 h-44 border-4 border-slate-900 rounded-2xl p-2 bg-white flex flex-col items-center justify-center relative">
            {/* Visual SVG QR representation */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950 fill-current">
              <rect x="0" y="0" width="30" height="30" rx="4" />
              <rect x="5" y="5" width="20" height="20" fill="white" rx="2" />
              <rect x="9" y="9" width="12" height="12" />

              <rect x="70" y="0" width="30" height="30" rx="4" />
              <rect x="75" y="5" width="20" height="20" fill="white" rx="2" />
              <rect x="79" y="9" width="12" height="12" />

              <rect x="0" y="70" width="30" height="30" rx="4" />
              <rect x="5" y="75" width="20" height="20" fill="white" rx="2" />
              <rect x="9" y="79" width="12" height="12" />

              <rect x="40" y="10" width="8" height="8" />
              <rect x="52" y="10" width="8" height="14" />
              <rect x="40" y="24" width="20" height="8" />
              <rect x="15" y="40" width="10" height="10" />
              <rect x="35" y="40" width="30" height="10" />
              <rect x="75" y="40" width="15" height="10" />
              <rect x="40" y="60" width="15" height="15" />
              <rect x="65" y="65" width="15" height="15" />
              <rect x="85" y="70" width="10" height="25" />
              <rect x="45" y="80" width="25" height="15" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-9 h-9 rounded-lg bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg">
                <Landmark className="w-5 h-5 text-slate-950 font-bold" />
              </div>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-600 mt-2 font-bold tracking-wider">
            SCAN TO TRANSFER INSTANTLY
          </span>
        </div>

        {/* Account Details Box */}
        <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Account Holder:</span>
            <span className="text-white font-semibold">{user.fullName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Account Number:</span>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-emerald-400 font-bold">{account.accountNumber}</span>
              <button
                onClick={handleCopy}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Copy Account Number"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Bank Name:</span>
            <span className="text-slate-200">ZR Digital Bank</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Branch / Routing:</span>
            <span className="font-mono text-slate-300">ZR-HQ-0192 (Gulshan)</span>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Account Number'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
