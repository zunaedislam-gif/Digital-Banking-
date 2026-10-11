import { useState, ReactNode } from 'react';
import { 
  Landmark, 
  LayoutDashboard, 
  Send, 
  ReceiptText, 
  Users, 
  CreditCard, 
  Receipt, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  Search,
  Shield,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export type DashboardTab = 
  | 'overview' 
  | 'send_money' 
  | 'transactions' 
  | 'beneficiaries' 
  | 'bills' 
  | 'cards' 
  | 'notifications' 
  | 'profile';

interface DashboardLayoutProps {
  currentTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  unreadCount?: number;
  children: ReactNode;
  onOpenNotifications?: () => void;
}

export function DashboardLayout({ 
  currentTab, 
  onTabChange, 
  unreadCount = 0, 
  children,
  onOpenNotifications
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { id: 'overview' as DashboardTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'send_money' as DashboardTab, label: 'Send Money', icon: Send },
    { id: 'transactions' as DashboardTab, label: 'Transactions', icon: ReceiptText },
    { id: 'beneficiaries' as DashboardTab, label: 'Beneficiaries', icon: Users },
    { id: 'bills' as DashboardTab, label: 'Bill Payment', icon: Receipt },
    { id: 'cards' as DashboardTab, label: 'Cards', icon: CreditCard },
    { id: 'notifications' as DashboardTab, label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'profile' as DashboardTab, label: 'Profile & Security', icon: UserIcon },
  ];

  const handleNavClick = (tab: DashboardTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md">
            <Landmark className="w-4 h-4 text-slate-950 font-bold" />
          </div>
          <span className="font-bold text-white tracking-tight">ZR Digital Bank</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleNavClick('notifications')}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/95 border-r border-slate-800 backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Logo & Platform Title */}
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Landmark className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block">ZR Digital Bank</span>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">
                Customer Banking
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition
                    ${isActive 
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-slate-950 text-white' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Sign Out in Sidebar Bottom */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
          <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-300 font-medium">Supabase Cloud</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Connected</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-bold text-sm shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-white block truncate">{user?.fullName}</span>
              <span className="text-[11px] text-slate-400 block truncate font-mono">{user?.email}</span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs font-semibold transition flex items-center justify-center space-x-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navigation Bar */}
        <header className="hidden md:flex h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-8 items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3 w-80">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search transactions, accounts, providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications Icon */}
            <button
              onClick={() => {
                if (onOpenNotifications) {
                  onOpenNotifications();
                } else {
                  onTabChange('notifications');
                }
              }}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white relative transition"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-slate-950">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User profile dropdown indicator */}
            <button
              onClick={() => onTabChange('profile')}
              className="flex items-center space-x-2.5 pl-3 border-l border-slate-800 hover:opacity-80 transition"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-white block">{user?.fullName}</span>
                <span className="text-[10px] text-slate-400 block font-mono">Personal Savings</span>
              </div>
            </button>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 md:hidden"
        ></div>
      )}
    </div>
  );
}
