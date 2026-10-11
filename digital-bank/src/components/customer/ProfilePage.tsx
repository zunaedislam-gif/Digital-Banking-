import { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Lock, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Clock, 
  Laptop, 
  Edit3, 
  Save, 
  X,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { formatDate, formatDateTime } from '../../utils/formatters.js';

export function ProfilePage() {
  const { user, account, logout } = useAuth();

  // Tab: 'profile' | 'security'
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security'>('profile');

  // Edit Profile Form State
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);
  const [isSavingPass, setIsSavingPass] = useState(false);

  // Login History State
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone);
      setAddress(user.address);
    }

    setLoadingHistory(true);
    api.getProfile()
      .then((data) => {
        if (data.loginHistory) {
          setLoginHistory(data.loginHistory);
        }
      })
      .catch((err) => console.error('Error fetching profile data:', err))
      .finally(() => setLoadingHistory(false));
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setIsSavingProfile(true);

    try {
      await api.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      setProfileSuccess('Personal details updated successfully in the core ledger.');
      setIsEditing(false);
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile details.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword.length < 6) {
      setPassError('New password must contain at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match. Please re-enter.');
      return;
    }

    setIsSavingPass(true);
    try {
      const res = await api.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPassSuccess(res.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(null), 5000);
    } catch (err: any) {
      setPassError(err.message || 'Failed to change password. Please verify your current password.');
    } finally {
      setIsSavingPass(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
            ACCOUNT MANAGEMENT
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Profile & Security
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your personal banking profile, change credentials, and inspect session history.
          </p>
        </div>

        <button
          onClick={() => logout()}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-500/10 border border-slate-800 text-rose-400 hover:text-rose-300 font-semibold text-xs transition flex items-center gap-2 self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Banking</span>
        </button>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-emerald-500/20 shrink-0">
          {user?.fullName?.charAt(0) || 'U'}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-xl font-bold text-white">{user?.fullName}</h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full self-center sm:self-auto">
              <CheckCircle2 className="w-3 h-3" /> VERIFIED CUSTOMER
            </span>
          </div>

          <p className="text-xs text-slate-400 font-mono">{user?.email}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-slate-400 font-mono">
            <span>Primary Account: <strong className="text-emerald-400">{account?.accountNumber}</strong></span>
            <span>•</span>
            <span>Customer ID: <strong className="text-slate-300">{user?.id}</strong></span>
            <span>•</span>
            <span>Member Since: <strong className="text-slate-300">{formatDate(user?.createdAt)}</strong></span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`px-5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeSubTab === 'profile'
              ? 'bg-slate-800 text-white font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Personal Information</span>
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={`px-5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeSubTab === 'security'
              ? 'bg-slate-800 text-white font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security & Passwords</span>
        </button>
      </div>

      {/* ================= TAB 1: PERSONAL INFORMATION ================= */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6">
          {profileSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-white">Legal Identification & Contact</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your registered details on file for compliance and bank notifications
                </p>
              </div>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5" /> Full Legal Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  ) : (
                    <div className="px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white font-medium">
                      {user?.fullName}
                    </div>
                  )}
                </div>

                {/* Email Address (Read-only) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Primary Email (Identity Verified)
                  </label>
                  <div className="px-4 py-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-400 font-mono flex items-center justify-between">
                    <span>{user?.email}</span>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Locked</span>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Contact Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  ) : (
                    <div className="px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white font-mono">
                      {user?.phone}
                    </div>
                  )}
                </div>

                {/* Date of Birth (Read-only) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Date of Birth
                  </label>
                  <div className="px-4 py-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-400 font-mono">
                    {user?.dateOfBirth ? formatDate(user.dateOfBirth) : '1995-06-20'}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Registered Residential Address
                </label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white">
                    {user?.address}
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ================= TAB 2: SECURITY & PASSWORDS ================= */}
      {activeSubTab === 'security' && (
        <div className="space-y-8">
          {/* Change Password Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="border-b border-slate-800 pb-4 mb-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                Change Security Password
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Update your login password. Strong passwords protect against unauthorized account access.
              </p>
            </div>

            {passSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5 mb-5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            {passError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5 mb-5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">New Password (min 6)</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Confirm New Password</label>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingPass || !currentPassword || !newPassword}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition disabled:opacity-40 shadow-lg shadow-emerald-500/20"
                >
                  {isSavingPass ? 'Updating Credentials...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Login & Security History Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="border-b border-slate-800 pb-4 mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Recent Sign-in & Authentication History
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Audit events recorded from your sessions and security activities
                </p>
              </div>

              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                Current IP: 103.125.101.44
              </span>
            </div>

            {loadingHistory ? (
              <div className="py-8 text-center text-slate-400 text-xs">Loading audit events...</div>
            ) : loginHistory.length > 0 ? (
              <div className="space-y-3">
                {loginHistory.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-white block">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {log.device} • IP: {log.ipAddress}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-slate-400 block text-[11px]">
                        {formatDateTime(log.timestamp)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase">
                        <CheckCircle2 className="w-3 h-3" /> {log.result}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">
                No recent security incidents logged.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
