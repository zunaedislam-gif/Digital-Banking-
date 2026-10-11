import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { LandingPage } from './components/landing/LandingPage.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { DashboardLayout, DashboardTab } from './components/layout/DashboardLayout.js';
import { CustomerDashboard } from './components/customer/CustomerDashboard.js';
import { SendMoneyModal } from './components/customer/SendMoneyModal.js';
import { SendMoneyPage } from './components/customer/SendMoneyPage.js';
import { TransactionHistoryPage } from './components/customer/TransactionHistoryPage.js';
import { BeneficiaryManagementPage } from './components/customer/BeneficiaryManagementPage.js';
import { BillPaymentPage } from './components/customer/BillPaymentPage.js';
import { BillPaymentModal } from './components/customer/BillPaymentModal.js';
import { CardsPage } from './components/customer/CardsPage.js';
import { NotificationsPage } from './components/customer/NotificationsPage.js';
import { ProfilePage } from './components/customer/ProfilePage.js';
import { AdminDashboard } from './components/admin/AdminDashboard.js';
import { DemoAccountSwitcher } from './components/common/DemoAccountSwitcher.js';
import { 
  Building2, 
  ShieldAlert, 
  Clock, 
  CreditCard, 
  Users, 
  Send, 
  ReceiptText, 
  Receipt, 
  Bell, 
  User as UserIcon,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from './services/api.js';

function MainApp() {
  const { user, account, logout, isAuthenticated, isAdmin, isCustomer, isLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<DashboardTab>('overview');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [sendMoneyModalOpen, setSendMoneyModalOpen] = useState<boolean>(false);
  const [preselectedTransferAccount, setPreselectedTransferAccount] = useState<string>('');
  const [billPaymentModalOpen, setBillPaymentModalOpen] = useState<boolean>(false);

  const refreshUnreadCount = () => {
    if (isAuthenticated && isCustomer) {
      api.getNotifications()
        .then((res) => {
          if (res.unreadCount !== undefined) {
            setUnreadCount(res.unreadCount);
          }
        })
        .catch(() => {});
    }
  };

  // Poll or fetch notifications count for badge
  useEffect(() => {
    refreshUnreadCount();
  }, [isAuthenticated, isCustomer, currentTab]);

  const openLogin = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-medium">Connecting to secure banking engine...</p>
      </div>
    );
  }

  // Public Landing Page if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <>
        <LandingPage onOpenLogin={openLogin} onOpenRegister={openRegister} />
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authModalMode}
          onClose={() => setAuthModalOpen(false)}
        />
      </>
    );
  }

  // Admin Portal Experience
  if (isAdmin) {
    return <AdminDashboard />;
  }

  // Customer Dashboard Experience
  return (
    <DashboardLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      unreadCount={unreadCount}
      onOpenNotifications={() => setCurrentTab('notifications')}
    >
      {/* Tab: Overview (Customer Dashboard) */}
      {currentTab === 'overview' && (
        <CustomerDashboard
          onNavigateTab={setCurrentTab}
          onOpenSendMoney={() => setSendMoneyModalOpen(true)}
          onOpenBillPayment={() => setBillPaymentModalOpen(true)}
        />
      )}

      {/* Tab: Send Money (Step 5 Completed) */}
      {currentTab === 'send_money' && (
        <SendMoneyPage />
      )}

      {/* Tab: Transactions (Step 6 Completed) */}
      {currentTab === 'transactions' && (
        <TransactionHistoryPage />
      )}

      {/* Tab: Beneficiaries (Step 7 Completed) */}
      {currentTab === 'beneficiaries' && (
        <BeneficiaryManagementPage
          onTransferToBeneficiary={(accNum) => {
            setPreselectedTransferAccount(accNum);
            setSendMoneyModalOpen(true);
          }}
        />
      )}

      {/* Tab: Bill Payment (Step 8 Completed) */}
      {currentTab === 'bills' && (
        <BillPaymentPage />
      )}

      {/* Tab: Cards (Step 9 Completed) */}
      {currentTab === 'cards' && (
        <CardsPage />
      )}

      {/* Tab: Notifications (Step 9 Completed) */}
      {currentTab === 'notifications' && (
        <NotificationsPage onRefreshCount={refreshUnreadCount} />
      )}

      {/* Tab: Profile & Security (Step 10 Completed) */}
      {currentTab === 'profile' && (
        <ProfilePage />
      )}

      {/* Global Send Money Modal */}
      <SendMoneyModal
        isOpen={sendMoneyModalOpen}
        initialRecipientAccountNumber={preselectedTransferAccount}
        onClose={() => {
          setSendMoneyModalOpen(false);
          setPreselectedTransferAccount('');
        }}
      />

      {/* Global Bill Payment Modal */}
      <BillPaymentModal
        isOpen={billPaymentModalOpen}
        onClose={() => setBillPaymentModalOpen(false)}
      />
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
      <DemoAccountSwitcher />
    </AuthProvider>
  );
}
