import React from 'react';
import { ShieldCheck, Lock, Award, HeartHandshake, Mail, Phone, Flame, Sparkles } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
  onOpenAdminLogin?: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAdminLogin, onOpenAuth }) => {
  return (
    <footer className="glass-panel border-t border-slate-800/80 bg-[#070a12] text-slate-400 text-xs mt-16 no-print">
      {/* Top trust badges bar */}
      <div className="border-b border-slate-800/80 py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-slate-200">100% Certified RNG</span>
            <span className="text-[11px] text-slate-500">Provably fair random ball draw</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <Lock className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-slate-200">Instant UPI &amp; Bank IMPS</span>
            <span className="text-[11px] text-slate-500">Fast withdrawals within 15 mins</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <Award className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-slate-200">8-Level Referral Tree</span>
            <span className="text-[11px] text-slate-500">Earn up to 4.6% on ticket play</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <HeartHandshake className="w-5 h-5 text-red-400" />
            <span className="font-bold text-slate-200">18+ Responsible Gaming</span>
            <span className="text-[11px] text-slate-500">Play responsibly &amp; set limits</span>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Col 1 & 2: About TAMBOLA LIVE */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-sm">
                TL
              </div>
              <span className="font-black text-xl tracking-wider text-slate-100">
                TAMBOLA <span className="text-amber-400">LIVE</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs max-w-sm">
              India's premier real-time online Tambola / Housie multiplayer platform. Enjoy real-time audio number calling, automatic winning claim verification, printable tickets, and an industry-leading 8-level ticket referral revenue engine.
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-300 pt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-amber-400" /> tickets@click-earn-hvfde7.p.tawk.email
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> +91 90000 12345
              </span>
            </div>
          </div>

          {/* Col 3: Quick Navigation */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
              Quick Games
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => onNavigate('live')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <Flame className="w-3 h-3 text-red-400" /> Live Tambola Room
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('buy-ticket')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Buy Tickets
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('games')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Upcoming Tournaments
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('winners')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Hall of Winners
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Earn & Manage */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
              Earnings &amp; Wallet
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => onNavigate('referral')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" /> 8-Level Referral (4.6%)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('wallet')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Wallet &amp; Deposits
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('my-tickets')}
                  className="hover:text-amber-400 transition-colors"
                >
                  My Ticket History
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('support')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Help &amp; Support Tickets
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: 8-Level Commission Structure */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
              8-Level Payout Tree
            </h4>
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-0.5 font-mono text-[11px]">
              <div className="flex justify-between text-amber-300 font-bold">
                <span>L1 (Direct)</span>
                <span>2.0%</span>
              </div>
              <div className="flex justify-between text-purple-300">
                <span>Level 2</span>
                <span>1.0%</span>
              </div>
              <div className="flex justify-between text-blue-300">
                <span>Level 3</span>
                <span>0.5%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Level 4</span>
                <span>0.4%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Level 5</span>
                <span>0.3%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Level 6</span>
                <span>0.2%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Level 7</span>
                <span>0.1%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Level 8</span>
                <span>0.1%</span>
              </div>
              <div className="pt-1 border-t border-slate-800 flex justify-between font-black text-amber-400 text-xs">
                <span>Total Payout</span>
                <span>4.6%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="pt-8 mt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 TAMBOLA LIVE. All rights reserved. Play Responsibly. 18+ only.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Terms &amp; Conditions</span>
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Responsible Gaming</span>
            <span className="hover:text-slate-400 cursor-pointer">24x7 Player Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
