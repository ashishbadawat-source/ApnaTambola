import React, { useState, useMemo } from 'react';
import {
  X,
  Minus,
  Plus,
  DollarSign,
  Wallet,
  Scissors,
  AlertTriangle,
  CheckCircle2,
  Search,
  User as UserIcon,
  ShieldAlert,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { User } from '../../types';

export type WalletSourceType = 'any' | 'deposit' | 'winning' | 'referral';

interface UniversalWalletAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  preselectedUser?: User | null;
  defaultType?: 'credit' | 'debit';
  onUpdateWalletBalance: (
    userId: string,
    amount: number,
    type: 'credit' | 'debit',
    reason?: string,
    walletSource?: WalletSourceType
  ) => Promise<boolean>;
}

export const UniversalWalletAdjustModal: React.FC<UniversalWalletAdjustModalProps> = ({
  isOpen,
  onClose,
  users,
  preselectedUser,
  defaultType = 'debit',
  onUpdateWalletBalance,
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(preselectedUser || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>(defaultType);
  const [walletSource, setWalletSource] = useState<WalletSourceType>('any');
  const [amount, setAmount] = useState<number>(100);
  const [reason, setReason] = useState<string>('एडमिन द्वारा डायरेक्ट कटौती');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync preselectedUser if it changes
  React.useEffect(() => {
    if (preselectedUser) {
      setSelectedUser(preselectedUser);
    }
  }, [preselectedUser]);

  React.useEffect(() => {
    setAdjustType(defaultType);
    if (defaultType === 'debit') {
      setReason('एडमिन द्वारा डायरेक्ट कटौती (Payment Deduction)');
    } else {
      setReason('एडमिन द्वारा डायरेक्ट पेमेंट क्रेडिट (Payment Credit)');
    }
  }, [defaultType, isOpen]);

  // Filter users by name, phone, or id
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users.slice(0, 15);
    const q = searchQuery.toLowerCase().trim();
    const cleanPhone = q.replace(/\D/g, '');
    return users
      .filter((u) => {
        const nameMatch = u.name && u.name.toLowerCase().includes(q);
        const idMatch = u.id && u.id.toLowerCase().includes(q);
        const phoneMatch = cleanPhone.length > 2 && u.phone && u.phone.replace(/\D/g, '').includes(cleanPhone);
        const emailMatch = u.email && u.email.toLowerCase().includes(q);
        return nameMatch || idMatch || phoneMatch || emailMatch;
      })
      .slice(0, 20);
  }, [users, searchQuery]);

  if (!isOpen) return null;

  const currentDeposit = selectedUser?.depositBalance || 0;
  const currentWinning = selectedUser?.winningBalance || 0;
  const currentReferral = selectedUser?.referralBalance || 0;
  const currentTotal = selectedUser ? (selectedUser.walletBalance ?? (currentDeposit + currentWinning + currentReferral)) : 0;

  // Selected balance to display based on walletSource
  const activeSourceBalance = () => {
    switch (walletSource) {
      case 'deposit':
        return currentDeposit;
      case 'winning':
        return currentWinning;
      case 'referral':
        return currentReferral;
      case 'any':
      default:
        return currentTotal;
    }
  };

  const projectedBalance = () => {
    if (!selectedUser) return 0;
    const cleanAmt = Math.max(0, Number(amount) || 0);
    if (adjustType === 'credit') {
      return currentTotal + cleanAmt;
    } else {
      return Math.max(0, currentTotal - cleanAmt);
    }
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val);
  };

  const handleMaxBalance = () => {
    const srcBal = activeSourceBalance();
    setAmount(Math.max(1, srcBal));
  };

  const handleExecute = async () => {
    if (!selectedUser) {
      setErrorMessage('कृपया पहले किसी यूजर को चुनें!');
      return;
    }
    const cleanAmt = Math.max(0, Number(amount) || 0);
    if (cleanAmt <= 0) {
      setErrorMessage('कृपया मान्य राशि दर्ज करें (कम से कम ₹1)');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const ok = await onUpdateWalletBalance(selectedUser.id, cleanAmt, adjustType, reason, walletSource);
      if (ok) {
        setSuccessMessage(
          `✓ सफलता: ${selectedUser.name} (${selectedUser.phone}) के वॉलेट से ₹${cleanAmt.toLocaleString('en-IN')} ${
            adjustType === 'debit' ? 'काट लिया गया (Debited)' : 'जोड़ दिया गया (Credited)'
          }!`
        );
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 1800);
      } else {
        setErrorMessage('वॉलेट अपडेट करने में विफल रहा। कृपया पुनः प्रयास करें।');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'अज्ञात त्रुटि हुई');
    } finally {
      setIsLoading(false);
    }
  };

  const QUICK_REASONS_DEBIT = [
    'गेम क्लेम पेनल्टी (Penalty for False Claim)',
    'गलत क्रेडिट रिवर्सल (Wrong Credit Reversal)',
    'फर्जी UTR जमा पेनल्टी (Fake UTR Slip Reversal)',
    'एडमिन डायरेक्ट कटौती (Admin Discretionary Debit)',
    'बोनस राशि कटौती (Bonus Adjustment)',
  ];

  const QUICK_REASONS_CREDIT = [
    'एडमिन पेमेंट क्रेडिट (Manual Recharge)',
    'गेम रीफंड / क्षतिपूर्ति (Game Compensation)',
    'स्पेशल बोनस पुरस्कार (Special Reward Bonus)',
    'ऑफलाइन पेमेंट अप्रूवल (Offline Cash Received)',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${adjustType === 'debit' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}`}>
              {adjustType === 'debit' ? <Scissors className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                <span>{adjustType === 'debit' ? 'यूजर पेमेंट कटौती टूल (Deduct Payment)' : 'यूजर वॉलेट क्रेडिट टूल (Add Payment)'}</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-[11px] text-slate-400">
                एडमिन कहीं से भी, किसी भी यूजर का पेमेंट (विनिंग, डिपॉजिट, या कुल बैलेंस) तुरंत कट या एडजस्ट कर सकता है।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Adjust Type Switcher (DEBIT vs CREDIT) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setAdjustType('debit');
              setReason('एडमिन द्वारा डायरेक्ट कटौती (Payment Deduction)');
            }}
            className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              adjustType === 'debit'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>✂️ पेमेंट कट करें (DEBIT)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAdjustType('credit');
              setReason('एडमिन द्वारा डायरेक्ट पेमेंट क्रेडिट (Payment Credit)');
            }}
            className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              adjustType === 'credit'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>💰 पैसे जोड़ें (CREDIT)</span>
          </button>
        </div>

        {/* Target User Section */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>टारगेट यूजर (Target User)</span>
            </span>
            {selectedUser && (
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer"
              >
                बदलें / दूसरा यूजर चुनें
              </button>
            )}
          </label>

          {selectedUser ? (
            /* Selected User Card with Breakdown */
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-400/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'}
                    alt={selectedUser.name}
                    className="w-11 h-11 rounded-xl object-cover border border-amber-400/40"
                  />
                  <div>
                    <div className="text-white font-black text-sm flex items-center gap-2">
                      <span>{selectedUser.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        {selectedUser.id}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">{selectedUser.phone}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">कुल वॉलेट</span>
                  <span className="text-lg font-black text-amber-300">
                    ₹{currentTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Detailed Sub-balances */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">💰 डिपॉजिट वॉलेट</span>
                  <span className="text-xs font-black text-white">₹{currentDeposit.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">🏆 विनिंग वॉलेट</span>
                  <span className="text-xs font-black text-emerald-400">₹{currentWinning.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">🎁 रेफरल वॉलेट</span>
                  <span className="text-xs font-black text-amber-400">₹{currentReferral.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ) : (
            /* User Search Box */
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="यूजर का नाम, मोबाइल नंबर या ID सर्च करें..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl bg-slate-950/80 border border-slate-800 p-1">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">कोई यूजर नहीं मिला</div>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(u);
                        setSearchQuery('');
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-slate-800/80 flex items-center justify-between transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 font-bold text-xs border border-slate-700">
                          {u.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                            {u.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {u.phone} • {u.id}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-400 block">
                          ₹{(u.walletBalance || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          (W: ₹{u.winningBalance || 0} | D: ₹{u.depositBalance || 0})
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Wallet Source Selection (कहाँ से कट / क्रेडिट करना है) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-amber-400" />
            <span>वॉलेट स्रोत चुनें (Where to deduct/credit from)</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setWalletSource('any')}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                walletSource === 'any'
                  ? 'bg-amber-400/15 border-amber-400 text-amber-200 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-black block text-white">🌟 कहीं से भी (Auto)</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">उपलब्ध फंड से ऑटो कट</span>
            </button>

            <button
              type="button"
              onClick={() => setWalletSource('winning')}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                walletSource === 'winning'
                  ? 'bg-emerald-500/15 border-emerald-400 text-emerald-200 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-black block text-white">🏆 विनिंग वॉलेट</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">
                उपलब्ध: ₹{currentWinning}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setWalletSource('deposit')}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                walletSource === 'deposit'
                  ? 'bg-blue-500/15 border-blue-400 text-blue-200 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-black block text-white">💰 डिपॉजिट वॉलेट</span>
              <span className="text-[10px] text-blue-400 block mt-0.5">
                उपलब्ध: ₹{currentDeposit}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setWalletSource('referral')}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                walletSource === 'referral'
                  ? 'bg-purple-500/15 border-purple-400 text-purple-200 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-black block text-white">🎁 रेफरल वॉलेट</span>
              <span className="text-[10px] text-purple-400 block mt-0.5">
                उपलब्ध: ₹{currentReferral}
              </span>
            </button>
          </div>
        </div>

        {/* Amount Input and Quick Buttons */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300">
              {adjustType === 'debit' ? 'कटौती राशि (Amount to Deduct ₹)' : 'क्रेडिट राशि (Amount to Add ₹)'}
            </label>
            {adjustType === 'debit' && selectedUser && activeSourceBalance() > 0 && (
              <button
                type="button"
                onClick={handleMaxBalance}
                className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 font-bold cursor-pointer transition-colors"
              >
                पूरा बैलेंस खाली करें (Clear ₹{activeSourceBalance()})
              </button>
            )}
          </div>

          <div className="relative">
            <span className="absolute left-4 top-3 text-lg font-black text-amber-400">₹</span>
            <input
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              min={1}
              placeholder="0"
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-9 pr-4 py-3 text-white font-black text-xl focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Quick preset amount chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[50, 100, 200, 500, 1000, 2000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAmount(val)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  amount === val
                    ? 'bg-amber-400 text-slate-950 font-black shadow'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                ₹{val}
              </button>
            ))}
          </div>
        </div>

        {/* Reason / Admin Audit Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">कटौती / एडजस्टमेंट का कारण (Reason / Note)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="उदा. गेम पेनल्टी, गलत UTR रिवर्सल, आदि..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          />

          {/* Quick Reason Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {(adjustType === 'debit' ? QUICK_REASONS_DEBIT : QUICK_REASONS_CREDIT).map((qReason, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setReason(qReason)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 cursor-pointer"
              >
                {qReason}
              </button>
            ))}
          </div>
        </div>

        {/* Live Calculation Preview */}
        {selectedUser && amount > 0 && (
          <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
            adjustType === 'debit'
              ? 'bg-red-500/10 border-red-500/30 text-red-200'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
          }`}>
            <div>
              <span className="font-semibold block">
                {adjustType === 'debit' ? '⚠️ कटौती के बाद नया बैलेंस:' : '✅ क्रेडिट के बाद नया बैलेंस:'}
              </span>
              <span className="text-[11px] opacity-80">
                पहले: ₹{currentTotal} {adjustType === 'debit' ? '-' : '+'} ₹{amount}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-black block">
                ₹{projectedBalance().toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] opacity-75">कुल वॉलेट अपडेट</span>
            </div>
          </div>
        )}

        {/* Feedback notices */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            रद्द करें (Cancel)
          </button>

          <button
            type="button"
            onClick={handleExecute}
            disabled={isLoading || !selectedUser || amount <= 0}
            className={`flex-2 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${
              adjustType === 'debit'
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/30'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/30'
            }`}
          >
            {isLoading ? (
              <span>प्रोसेसिंग हो रही है...</span>
            ) : adjustType === 'debit' ? (
              <>
                <Scissors className="w-4 h-4" />
                <span>तुरंत ₹{amount || 0} पेमेंट कट करें (Deduct Now)</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>तुरंत ₹{amount || 0} वॉलेट में जोड़ें (Credit Now)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
