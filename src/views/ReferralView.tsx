import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  Gift,
  TrendingUp,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Layers,
} from 'lucide-react';
import { User, ReferralMember, ReferralCommission } from '../types';

interface ReferralViewProps {
  currentUser: User;
  referralMembers: ReferralMember[];
  commissions: ReferralCommission[];
  onOpenDeposit: () => void;
}

export const ReferralView: React.FC<ReferralViewProps> = ({
  currentUser,
  referralMembers,
  commissions,
  onOpenDeposit,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | 'all'>('all');

  const getReferralLink = () => {
    if (typeof window === 'undefined') return `/?ref=${currentUser.referralCode}`;
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl.replace(/\/$/, '')}/?ref=${currentUser.referralCode}`;
  };

  const referralLink = getReferralLink();

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Join me on TAMBOLA LIVE! Play live Housie games and win exciting prizes. Use my referral code ${currentUser.referralCode} to get started: ${referralLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const totalEarnings = commissions
    .filter((c) => c.status === 'approved')
    .reduce((acc, c) => acc + c.commissionAmount, 0);

  const directMembersCount = referralMembers.filter((m) => m.level === 1).length;
  const teamMembersCount = referralMembers.length;

  const levelStats = [
    { level: 1, percent: '2.0%', name: 'Direct Referral Income (L1)', desc: 'Earned on every direct member ticket purchase', color: 'from-amber-500/20 border-amber-400/50 text-amber-300' },
    { level: 2, percent: '1.0%', name: 'Team Referral Income (L2)', desc: 'Earned when your direct team refers friends', color: 'from-purple-600/20 border-purple-500/50 text-purple-300' },
    { level: 3, percent: '0.5%', name: 'Team Referral Income (L3)', desc: '3rd-tier network ticket purchases', color: 'from-indigo-600/20 border-indigo-500/50 text-indigo-300' },
    { level: 4, percent: '0.4%', name: 'Team Referral Income (L4)', desc: '4th-tier network ticket purchases', color: 'from-blue-600/20 border-blue-500/50 text-blue-300' },
    { level: 5, percent: '0.3%', name: 'Team Referral Income (L5)', desc: '5th-tier network ticket purchases', color: 'from-teal-600/20 border-teal-500/50 text-teal-300' },
    { level: 6, percent: '0.2%', name: 'Team Referral Income (L6)', desc: '6th-tier network ticket purchases', color: 'from-emerald-600/20 border-emerald-500/50 text-emerald-300' },
    { level: 7, percent: '0.1%', name: 'Team Referral Income (L7)', desc: '7th-tier network ticket purchases', color: 'from-cyan-600/20 border-cyan-500/50 text-cyan-300' },
    { level: 8, percent: '0.1%', name: 'Team Referral Income (L8)', desc: '8th-tier network ticket purchases', color: 'from-rose-600/20 border-rose-500/50 text-rose-300' },
  ];

  const filteredMembers = referralMembers.filter((m) => {
    if (selectedLevelFilter === 'all') return true;
    return m.level === selectedLevelFilter;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="relative rounded-3xl glass-panel-purple border-2 border-purple-500/40 p-6 sm:p-10 shadow-2xl space-y-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 rounded-full px-3 py-1 text-xs font-bold text-amber-300">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>8-Level Multi-Tier Revenue Tree</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-100">
              Earn Up to <span className="text-amber-400">4.6% Commission</span> Across 8 Levels
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Build your Tambola squad! Whenever any user in your 8-tier network buys a ticket or plays a match, the server automatically credits your commission in real time. (Only on ticket purchases, no commission on deposit payments).
            </p>
          </div>

          {/* Referral Link & Code Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-amber-400/40 space-y-3 lg:w-96 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold uppercase">My Referral ID</span>
              <span className="font-mono text-base font-black text-amber-400">
                {currentUser.referralCode}
              </span>
            </div>

            {/* Link Copy input */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="w-full bg-transparent text-xs text-slate-300 px-2 outline-none truncate font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <button
              onClick={handleShareWhatsApp}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share on WhatsApp &amp; Telegram</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Earnings</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 text-glow-gold">
              ₹{totalEarnings.toFixed(2)}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Direct Referrals (L1)</span>
            <span className="text-xl sm:text-2xl font-black text-slate-100">
              {directMembersCount}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Team Network</span>
            <span className="text-xl sm:text-2xl font-black text-purple-300">
              {teamMembersCount} Members
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Commission Cap</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400">
              4.6% (On Ticket Play)
            </span>
          </div>
        </div>

        {/* Important Rule Notice */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>कमीशन नियम:</strong> यह 8-लेवल इनकम केवल यूज़र द्वारा खेले जाने वाले <strong>टिकट की खरीद</strong> पर बनती है। वॉलेट डिपॉजिट (पेमेंट ऐड) पर कोई कमीशन नहीं बनता है।
          </span>
        </div>
      </div>

      {/* 8 Level-Wise Income Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-100">
              8-Level Payout Structure
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Automated Server-Side Calculation (Total 4.6%)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
          {levelStats.map((lvl) => {
            const count = referralMembers.filter((m) => m.level === lvl.level).length;
            const earned = commissions
              .filter((c) => c.level === lvl.level && c.status === 'approved')
              .reduce((acc, c) => acc + c.commissionAmount, 0);

            return (
              <div
                key={lvl.level}
                className={`p-4 rounded-3xl glass-panel bg-gradient-to-b ${lvl.color} border shadow-xl flex flex-col justify-between space-y-3`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                      LEVEL {lvl.level}
                    </span>
                    <span className="text-lg sm:text-xl font-black">{lvl.percent}</span>
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-100">{lvl.name}</h3>
                  <p className="text-[10px] text-slate-400 leading-tight">{lvl.desc}</p>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Members:</span>
                    <strong className="text-slate-200">{count}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Earned:</span>
                    <strong className="text-amber-400 font-black">₹{earned.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Referral Network Members List */}
      <section className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              Referral Team Members ({filteredMembers.length})
            </h3>
            <p className="text-xs text-slate-400">
              Track your downstream network activity and commissions across all 8 tiers.
            </p>
          </div>

          {/* Level Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
            <button
              onClick={() => setSelectedLevelFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold ${
                selectedLevelFilter === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400'
              }`}
            >
              All Levels
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevelFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg font-bold ${
                  selectedLevelFilter === lvl ? 'bg-purple-600 text-white' : 'text-slate-400'
                }`}
              >
                L{lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Member</th>
                <th className="p-3">Level</th>
                <th className="p-3">Joined Date</th>
                <th className="p-3">Tickets Bought</th>
                <th className="p-3 text-right">Commission Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <Users className="w-8 h-8 text-amber-500/60 mx-auto mb-2" />
                    <p className="font-bold text-sm text-slate-200">
                      {selectedLevelFilter === 'all'
                        ? 'अभी तक कोई रेफरल सदस्य नहीं जुड़े हैं।'
                        : `लेवल ${selectedLevelFilter} में अभी कोई सदस्य नहीं है।`}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      अपना रेफरल कोड <strong className="text-amber-400 font-mono">{currentUser.referralCode}</strong> दोस्तों और व्हाट्सएप्प ग्रुप्स में शेयर करें। जैसे ही कोई नया यूजर रजिस्टर करेगा, उनका नाम व आईडी तुरंत यहाँ दिखेगा!
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 flex items-center gap-2.5">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-7 h-7 rounded-full object-cover border border-purple-500/40"
                      />
                      <div>
                        <span className="font-bold text-slate-100 block">{member.name}</span>
                        <span className="text-[10px] text-slate-500">{member.phone || member.email || member.id}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        member.level === 1 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-purple-900/40 text-purple-300'
                      }`}>
                        Level {member.level}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{member.joinedDate}</td>
                    <td className="p-3 font-semibold text-slate-200">{member.ticketsBought} tickets</td>
                    <td className="p-3 text-right font-black text-amber-400">
                      +₹{member.commissionEarned.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Commission Ledger History */}
      <section className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-slate-100">
          Recent Commission Transactions
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Txn ID</th>
                <th className="p-3">Source Member</th>
                <th className="p-3">Level / Rate</th>
                <th className="p-3">Base Ticket Cost</th>
                <th className="p-3 text-right">Commission Credited</th>
                <th className="p-3">Date &amp; Time</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {commissions.map((comm) => (
                <tr key={comm.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 text-amber-300">{comm.transactionId}</td>
                  <td className="p-3 font-sans font-semibold text-slate-100">{comm.sourceUserName}</td>
                  <td className="p-3">Level {comm.level} ({comm.percentage}%)</td>
                  <td className="p-3 text-slate-400">₹{comm.baseAmount}</td>
                  <td className="p-3 text-right font-black text-amber-400">
                    +₹{comm.commissionAmount.toFixed(2)}
                  </td>
                  <td className="p-3 text-slate-500 text-[11px] font-sans">{comm.timestamp}</td>
                  <td className="p-3 font-sans">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Approved
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
