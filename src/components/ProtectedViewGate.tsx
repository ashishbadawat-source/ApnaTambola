import React from 'react';
import { Lock, LogIn, UserPlus, Sparkles, ShieldCheck, Ticket, Wallet } from 'lucide-react';

interface ProtectedViewGateProps {
  title: string;
  subtitle?: string;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onNavigate: (tab: string) => void;
}

export function ProtectedViewGate({
  title,
  subtitle,
  onOpenAuth,
  onNavigate,
}: ProtectedViewGateProps) {
  return (
    <div className="max-w-xl mx-auto py-10 px-4 text-center space-y-6">
      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/95 border-2 border-amber-400/50 shadow-2xl shadow-amber-950/40 space-y-6 backdrop-blur-xl relative overflow-hidden">
        {/* Glow corner */}
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-purple-500/15 blur-2xl pointer-events-none" />

        <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-xl shadow-amber-500/20 mx-auto flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
            <Lock className="w-8 h-8" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            {subtitle ||
              'बिना लॉगिन आईडी और पासवर्ड के आपका अकाउंट या डैशबोर्ड एक्सेस नहीं किया जा सकता। कृपया अपने रजिस्टर्ड यूजर आईडी/पासवर्ड से लॉगिन करें।'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-left text-xs text-amber-200/90 space-y-2">
          <div className="font-bold flex items-center gap-1.5 text-amber-300 text-sm">
            <ShieldCheck className="w-4 h-4 text-amber-400" /> 100% सुरक्षित यूज़र प्रमाणीकरण
          </div>
          <div className="space-y-1 text-slate-300">
            <div className="flex items-start gap-1.5">
              <span className="text-amber-400 font-bold">•</span>
              <span>केवल वही यूजर लॉगिन कर सकता है जिसका यूजर आईडी और पासवर्ड सिस्टम में रजिस्टर्ड है।</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-amber-400 font-bold">•</span>
              <span>यदि आप नए खिलाड़ी हैं, तो तुरंत रजिस्टर करें और ₹10 मुफ्त वेलकम बोनस प्राप्त करें।</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => onOpenAuth('login')}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>यूज़र लॉगिन (Login)</span>
          </button>

          <button
            onClick={() => onOpenAuth('register')}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-900/60 to-slate-900 hover:from-purple-900/90 hover:to-slate-800 border border-purple-400/50 text-purple-200 hover:text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-purple-300" />
            <span>नया खाता बनाएं (+₹10)</span>
          </button>
        </div>

        <div className="pt-2 flex items-center justify-center gap-4 text-xs">
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
