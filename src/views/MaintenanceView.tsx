import React, { useEffect } from 'react';
import { Wrench } from 'lucide-react';
import { removeTawkWidget } from '../utils/tawk';
import { removeBrevoWidget } from '../utils/brevoConversations';

export const MaintenanceView: React.FC = () => {
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
