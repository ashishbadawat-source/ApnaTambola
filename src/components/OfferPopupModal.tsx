import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Gift,
  Copy,
  Check,
  ArrowRight,
  Flame,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { OfferPopup } from '../types';

interface OfferPopupModalProps {
  offer: OfferPopup | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (targetTab: string) => void;
}

export const OfferPopupModal: React.FC<OfferPopupModalProps> = ({
  offer,
  isOpen,
  onClose,
  onAction,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !offer) return null;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (offer.promoCode) {
      navigator.clipboard?.writeText(offer.promoCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleActionClick = () => {
    onClose();
    onAction(offer.actionTab || 'wallet');
  };

  return (
    <div
      id="offer-popup-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        id={`offer-popup-${offer.id}`}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-gradient-to-b from-[#1c1236] via-[#101838] to-[#0d071a] border-2 border-amber-400/60 shadow-2xl shadow-amber-500/20 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-gradient-to-r from-amber-500/30 via-pink-500/30 to-purple-500/30 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="btn-close-offer-popup"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition-all cursor-pointer shadow-lg"
          aria-label="Close offer modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Banner Graphic Header */}
        {offer.imageUrl ? (
          <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-900">
            <img
              src={offer.imageUrl}
              alt={offer.title}
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1c1236] via-[#1c1236]/40 to-transparent" />

            {/* Badge floating on image */}
            {offer.badgeText && (
              <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{offer.badgeText}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="relative pt-8 px-6 pb-2 text-center">
            {offer.badgeText && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg mb-2">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>{offer.badgeText}</span>
              </div>
            )}
          </div>
        )}

        {/* Offer Content Body */}
        <div className="p-6 sm:p-7 space-y-5">
          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              {offer.title}
            </h2>
            {offer.subtitle && (
              <p className="text-sm font-bold text-amber-300">
                {offer.subtitle}
              </p>
            )}
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              {offer.description}
            </p>
          </div>

          {/* Bonus / Discount Strip Card */}
          {offer.discountOrBonusText && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-purple-500/15 border border-amber-400/50 flex items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400 text-slate-950">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-300">Special Offer Benefit</div>
                  <div className="text-xs sm:text-sm font-black text-white">{offer.discountOrBonusText}</div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold whitespace-nowrap">
                Limited Time
              </span>
            </div>
          )}

          {/* Promo Code Box */}
          {offer.promoCode && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Promo / Coupon Code:
              </span>
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950 border-2 border-dashed border-amber-400/60">
                <span className="font-mono text-base font-black text-amber-300 tracking-widest pl-2">
                  {offer.promoCode}
                </span>
                <button
                  id="btn-copy-promo-code"
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'COPIED!' : 'COPY CODE'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="space-y-2 pt-2">
            <button
              id="btn-claim-offer-action"
              onClick={handleActionClick}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all cursor-pointer transform hover:scale-102 active:scale-98"
            >
              <span>{offer.actionText || 'Claim Offer Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> 100% Genuine Benefit
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
