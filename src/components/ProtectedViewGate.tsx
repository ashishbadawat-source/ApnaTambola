import React, { useState } from 'react';
import { Lock, LogIn, UserPlus, Sparkles, ShieldCheck, Ticket, Wallet, ArrowRight, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { MASTER_ADMIN_ASHISH, DEFAULT_USER, INITIAL_USERS } from '../data/mockData';
import { playWinningFanfare } from '../utils/audio';

interface ProtectedViewGateProps {
  title: string;
  subtitle?: string;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onNavigate: (tab: string) => void;
  onDirectLogin?: (user: User) => void;
  allUsers?: User[];
}

export function ProtectedViewGate({
  title,
  subtitle,
  onOpenAuth,
  onNavigate,
  onDirectLogin,
  allUsers = [],
}: ProtectedViewGateProps) {
  const [quickInput, setQuickInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleInstantOpen = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = quickInput.trim();
    if (!raw) {
      setErrorMsg('कृपया अपना यूजर ID या मोबाइल नंबर दर्ज करें');
      return;
    }

    const cleanLower = raw.toLowerCase();
    const digits = raw.replace(/\D/g, '').slice(-10);

    // 1. Check Master Admin Ashish Badawat
    if (
      cleanLower === 'ashishbadawat@gmail.com' ||
      cleanLower === 'admin_master_1' ||
      cleanLower === 'admin' ||
      cleanLower.includes('ashish')
    ) {
      playWinningFanfare();
      if (onDirectLogin) onDirectLogin({ ...MASTER_ADMIN_ASHISH, role: 'admin' });
      return;
    }

    // 2. Check allUsers & INITIAL_USERS
    const pool = [...allUsers, ...INITIAL_USERS];
    let matched = pool.find((u) => {
      if (!u) return false;
      if (u.id && (u.id.toLowerCase() === cleanLower || u.id.toLowerCase().replace(/^user_/, '') === cleanLower.replace(/^user_/, ''))) return true;
      if (digits.length === 10 && u.phone && u.phone.replace(/\D/g, '').slice(-10) === digits) return true;
      if (u.email && u.email.toLowerCase() === cleanLower) return true;
      if (u.username && u.username.toLowerCase() === cleanLower) return true;
      if (u.name && (u.name.toLowerCase() === cleanLower || u.name.toLowerCase().includes(cleanLower))) return true;
      return false;
    });

    // 3. If not found, auto-create on the fly so login NEVER fails
    if (!matched) {
      const rawClean = raw.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || `user_${Date.now()}`;
      const isDigitsPhone = digits.length === 10;
      matched = {
        id: raw.startsWith('user_') ? raw : isDigitsPhone ? `user_${digits}` : `user_${rawClean}`,
        name: isDigitsPhone ? `खिलाड़ी ${digits.slice(-4)}` : raw.charAt(0).toUpperCase() + raw.slice(1),
        username: rawClean,
        phone: isDigitsPhone ? `+91 ${digits}` : `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: raw.includes('@') ? raw.toLowerCase() : `${rawClean}@tambolalive.com`,
        password: 'password123',
        role: (rawClean.includes('admin') || rawClean.includes('ashish')) ? 'admin' : 'user',
        status: 'active',
        isBlocked: false,
        walletBalance: 0,
        depositBalance: 0,
        winningBalance: 0,
        referralBalance: 0,
        bonusRewardBalance: 0,
        firstDepositBonusClaimed: false,
        hasDeposited: false,
        referralCode: `REF-${rawClean.slice(0, 4).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
        kycStatus: 'unverified',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
        createdAt: new Date().toISOString(),
      };
    }

    playWinningFanfare();
    if (onDirectLogin) {
      onDirectLogin(matched);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 text-center space-y-6">
      <div className="p-6 sm:p-9 rounded-3xl bg-slate-900/95 border-2 border-amber-400/50 shadow-2xl shadow-amber-950/40 space-y-5 backdrop-blur-xl relative overflow-hidden">
        {/* Glow corner */}
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-purple-500/15 blur-2xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-xl shadow-amber-500/20 mx-auto flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
            <Lock className="w-7 h-7" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            {subtitle || 'कृपया अपना यूजर ID या मोबाइल नंबर दर्ज करें और तुरंत डैशबोर्ड खोलें।'}
          </p>
        </div>

        {/* ⚡ INSTANT USER ID DIRECT LOGIN BOX */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border-2 border-amber-400/40 text-left space-y-3 shadow-inner">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-amber-400" />
              <span>सीधा यूजर ID / मोबाइल नंबर से खोलें (Instant Open)</span>
            </label>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
              रजिस्ट्रेशन जरूरी नहीं
            </span>
          </div>

          <form onSubmit={handleInstantOpen} className="space-y-2.5">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => {
                  setQuickInput(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="यूजर ID या 10-अंकों का मोबाइल नंबर"
                className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="py-3 px-5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
              >
                <LogIn className="w-4 h-4" />
                <span>आईडी खोलें</span>
              </button>
            </div>
            {errorMsg && (
              <p className="text-xs text-rose-400 font-semibold">{errorMsg}</p>
            )}
            <p className="text-[11px] text-slate-400">
              💡 कोई भी यूजर ID या मोबाइल नंबर डालें, यह तुरंत लॉगिन होकर डैशबोर्ड खोल देगा।
            </p>
          </form>
        </div>

        {/* Direct 1-Click Fast Login Shortcuts */}
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            ⚡ 1-क्लिक डायरेक्ट फास्ट लॉगिन
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                playWinningFanfare();
                if (onDirectLogin) onDirectLogin({ ...MASTER_ADMIN_ASHISH, role: 'admin' });
              }}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/50 hover:border-purple-300 text-purple-200 hover:text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>👑 मास्टर एडमिन (Ashish)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playWinningFanfare();
                if (onDirectLogin) onDirectLogin(DEFAULT_USER);
              }}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/50 hover:border-emerald-300 text-emerald-200 hover:text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>🎮 टेस्ट प्लेयर लॉगिन</span>
            </button>
          </div>
        </div>

        {/* Traditional Auth Modal triggers */}
        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onOpenAuth('login')}
            className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-amber-400" />
            <span>लॉगिन डायलॉग</span>
          </button>

          <button
            onClick={() => onOpenAuth('register')}
            className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>नया खाता बनाएं (+₹10)</span>
          </button>
        </div>

        <div className="pt-1 flex items-center justify-center gap-4 text-xs">
          <button
            onClick={() => onNavigate('home')}
            className="text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            ← मुख्य पृष्ठ (Home Page)
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => onNavigate('how-to-play')}
            className="text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            गेम नियम (Rules)
          </button>
        </div>
      </div>
    </div>
  );
}
