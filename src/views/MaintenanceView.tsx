import React, { useEffect } from 'react';
import { Wrench, LogIn, Power } from 'lucide-react';
import { removeTawkWidget } from '../utils/tawk';
import { removeBrevoWidget } from '../utils/brevoConversations';

interface MaintenanceViewProps {
  isUserAdmin?: boolean;
  onMakeLive?: () => void;
  onOpenAdminLogin: () => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  isUserAdmin,
  onMakeLive,
  onOpenAdminLogin,
}) => {
  // Ensure all live chat / message widgets (Tawk / Brevo) are removed completely
  useEffect(() => {
    removeTawkWidget();
    removeBrevoWidget();
    const interval = setInterval(() => {
      removeTawkWidget();
      removeBrevoWidget();
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col items-center justify-center relative p-6 select-none">
      {/* Top Discreet Admin Access / Live Toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {isUserAdmin && onMakeLive ? (
          <button
            type="button"
            onClick={onMakeLive}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 border border-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-900/30"
            title="Make Website Live"
          >
            <Power className="w-3.5 h-3.5" />
            <span>वेबसाइट लाइव करें (Make Live)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAdminLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            title="Admin Login"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        )}
      </div>

      {/* Center Ultra-Clean Maintenance Display */}
      <div className="flex flex-col items-center text-center space-y-4 max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/5">
          <Wrench className="w-10 h-10 animate-[spin_10s_linear_infinite]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase">
          website maintenance
        </h1>
      </div>
    </div>
  );
};

