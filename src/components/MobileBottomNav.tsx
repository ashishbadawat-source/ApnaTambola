import React from 'react';
import { Home, Flame, Ticket, Wallet, Users, Grid, LogIn, LayoutDashboard, Trophy, Gamepad2 } from 'lucide-react';
import { User } from '../types';

interface MobileBottomNavProps {
  activeTab: string;
  currentUser?: User | null;
  onNavigate: (tab: string) => void;
  onOpenAllOptions: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  unreadCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  currentUser,
  onNavigate,
  onOpenAllOptions,
  onOpenAuth,
}) => {
  const visitorItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'live', label: 'Play Live', icon: Flame, isLive: true },
    { id: 'games', label: 'Tournaments', icon: Gamepad2 },
    { id: 'winners', label: 'Winners', icon: Trophy },
  ];

  const loggedInItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live', label: 'Play Live', icon: Flame, isLive: true },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'referral', label: 'Referral', icon: Users },
  ];

  const items = currentUser ? loggedInItems : visitorItems;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex-1 py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/30 scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-4 h-4 ${
                    item.isLive && !isActive ? 'text-red-400 animate-bounce' : ''
                  }`}
                />
                {item.isLive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping absolute -top-0.5 -right-0.5" />
                )}
              </div>
              <span className="text-[10px] font-bold mt-0.5 truncate">{item.label}</span>
            </button>
          );
        })}

        {/* If Visitor: Show direct Login & Register Button */}
        {!currentUser && (
          <button
            onClick={() => onOpenAuth && onOpenAuth('login')}
            className="flex-1 py-1.5 px-1 rounded-xl flex flex-col items-center justify-center bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span className="text-[10px] font-black mt-0.5">Login (+₹10)</span>
          </button>
        )}

        {/* Quick Directory Button */}
        <button
          onClick={onOpenAllOptions}
          className="flex-1 py-1.5 px-1 rounded-xl flex flex-col items-center justify-center text-purple-300 hover:text-purple-100 hover:bg-purple-900/30 transition-all cursor-pointer"
        >
          <Grid className="w-4 h-4 text-purple-400" />
          <span className="text-[10px] font-black mt-0.5">All</span>
        </button>
      </div>
    </div>
  );
};
export default MobileBottomNav;
