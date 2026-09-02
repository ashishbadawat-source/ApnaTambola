import React, { useState } from 'react';
import {
  Gift,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Sparkles,
  Flame,
  Copy,
  Tag,
  ArrowRight,
  Sliders,
  Image as ImageIcon,
  Check,
  Zap,
} from 'lucide-react';
import { OfferPopup } from '../../types';
import { OfferPopupModal } from '../../components/OfferPopupModal';

interface ModuleOfferPopupsProps {
  offers: OfferPopup[];
  onSaveOffer: (offer: OfferPopup) => Promise<boolean> | void;
  onDeleteOffer: (offerId: string) => Promise<boolean> | void;
  onToggleOfferStatus: (offerId: string) => Promise<boolean> | void;
}

const PRESET_BANNERS = [
  {
    name: 'Casino & Gold Coins',
    url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Celebration & Confetti',
    url: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Golden Trophy & Luxury',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Festive Lights & Sparkles',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  },
];

export const ModuleOfferPopups: React.FC<ModuleOfferPopupsProps> = ({
  offers = [],
  onSaveOffer,
  onDeleteOffer,
  onToggleOfferStatus,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferPopup | null>(null);
  const [previewOffer, setPreviewOffer] = useState<OfferPopup | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_BANNERS[0].url);
  const [badgeText, setBadgeText] = useState('🔥 HOT OFFER');
  const [promoCode, setPromoCode] = useState('BONUS100');
  const [discountOrBonusText, setDiscountOrBonusText] = useState('10% Extra on Every Deposit');
  const [actionText, setActionText] = useState('Deposit Now (रिचार्ज करें)');
  const [actionTab, setActionTab] = useState('wallet');
  const [isActive, setIsActive] = useState(true);
  const [showOnAppLaunch, setShowOnAppLaunch] = useState(true);
  const [targetAudience, setTargetAudience] = useState<'all' | 'new_users' | 'existing_users'>('all');

  const handleOpenAddForm = () => {
    setEditingOffer(null);
    setTitle('🎉 Exclusive Deposit Booster');
    setSubtitle('Get 10% Extra Bonus instantly in your wallet!');
    setDescription('आज ही न्यूनतम ₹100 का रिचार्ज करें और 10% दैनिक रिवार्ड अनलॉक के साथ तंबोला टिकट खेलें।');
    setImageUrl(PRESET_BANNERS[0].url);
    setBadgeText('🔥 SPECIAL OFFER');
    setPromoCode('TAMBOLA100');
    setDiscountOrBonusText('10% Instant Bonus Unlock');
    setActionText('Add Money Now');
    setActionTab('wallet');
    setIsActive(true);
    setShowOnAppLaunch(true);
    setTargetAudience('all');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (offer: OfferPopup) => {
    setEditingOffer(offer);
    setTitle(offer.title);
    setSubtitle(offer.subtitle || '');
    setDescription(offer.description);
    setImageUrl(offer.imageUrl || PRESET_BANNERS[0].url);
    setBadgeText(offer.badgeText || '🔥 HOT OFFER');
    setPromoCode(offer.promoCode || '');
    setDiscountOrBonusText(offer.discountOrBonusText || '');
    setActionText(offer.actionText || 'Claim Offer');
    setActionTab(offer.actionTab || 'wallet');
    setIsActive(offer.isActive);
    setShowOnAppLaunch(offer.showOnAppLaunch);
    setTargetAudience(offer.targetAudience || 'all');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const offerData: OfferPopup = {
      id: editingOffer ? editingOffer.id : `offer_${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      description: description.trim(),
      imageUrl: imageUrl.trim() || undefined,
      badgeText: badgeText.trim() || undefined,
      promoCode: promoCode.trim().toUpperCase() || undefined,
      discountOrBonusText: discountOrBonusText.trim() || undefined,
      actionText: actionText.trim() || 'Claim Now',
      actionTab: actionTab || 'wallet',
      isActive,
      showOnAppLaunch,
      targetAudience,
      createdAt: editingOffer ? editingOffer.createdAt : new Date().toISOString(),
    };

    if (onSaveOffer) {
      await onSaveOffer(offerData);
    }

    setIsFormOpen(false);
    setSaveNotice(`✓ ऑफर पॉपअप "${offerData.title}" सफलतापूर्वक सेव कर दिया गया!`);
    setTimeout(() => setSaveNotice(null), 4000);
  };

  const handleDelete = async (offerId: string, offerTitle: string) => {
    if (window.confirm(`क्या आप सच में ऑफर "${offerTitle}" को हटाना चाहते हैं?`)) {
      if (onDeleteOffer) {
        await onDeleteOffer(offerId);
        setSaveNotice(`✓ ऑफर हटा दिया गया!`);
        setTimeout(() => setSaveNotice(null), 3000);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-pink-950/70 via-purple-950/70 to-slate-900 p-6 border-2 border-pink-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-pink-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
              PROMOTIONAL MARKETING
            </span>
            <span className="text-xs text-pink-300 font-semibold">
              Live In-App Popups &amp; Banners
            </span>
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Gift className="w-6 h-6 text-pink-400" />
            <span>Offer Popups Manager (ऑफर पॉपअप प्रबंधन)</span>
          </h2>
          <p className="text-xs text-slate-300">
            Create attractive promotional banners, discount coupons, and tournament announcement popups that appear on user login or app launch.
          </p>
        </div>

        <button
          id="btn-admin-add-offer-popup"
          onClick={handleOpenAddForm}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-pink-500/30 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Offer Popup</span>
        </button>
      </div>

      {saveNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Offers List Table / Grid */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-pink-400" />
            <span>All Configured Offer Popups ({offers.length})</span>
          </h3>
        </div>

        {offers.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 space-y-3">
            <Gift className="w-12 h-12 text-pink-400/60 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">No Offer Popups Configured</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first promotional offer popup with custom promo codes and banner graphics.
            </p>
            <button
              onClick={handleOpenAddForm}
              className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 text-slate-950 font-black text-xs cursor-pointer"
            >
              + Create Offer Popup
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className={`p-5 rounded-3xl border transition-all space-y-4 relative overflow-hidden ${
                  offer.isActive
                    ? 'bg-gradient-to-br from-slate-900/90 to-purple-950/40 border-pink-500/40 shadow-lg'
                    : 'bg-slate-950/80 border-slate-800/80 opacity-75'
                }`}
              >
                {/* Status Pill & Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleOfferStatus && onToggleOfferStatus(offer.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                        offer.isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {offer.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>ACTIVE (चालू)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-slate-400" />
                          <span>DISABLED (बंद)</span>
                        </>
                      )}
                    </button>

                    {offer.showOnAppLaunch && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                        ⚡ Launch Popup
                      </span>
                    )}
                  </div>

                  {offer.badgeText && (
                    <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-black border border-pink-500/30">
                      {offer.badgeText}
                    </span>
                  )}
                </div>

                {/* Offer Image Thumbnail & Main Details */}
                <div className="flex items-start gap-3.5">
                  {offer.imageUrl && (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                      <img
                        src={offer.imageUrl}
                        alt={offer.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="font-black text-sm text-white truncate">{offer.title}</h4>
                    {offer.subtitle && (
                      <p className="text-xs font-semibold text-amber-300 truncate">{offer.subtitle}</p>
                    )}
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                      {offer.description}
                    </p>
                  </div>
                </div>

                {/* Benefit & Promo Code Strip */}
                <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">PROMO CODE:</span>
                    <span className="font-mono font-black text-amber-300 text-xs">
                      {offer.promoCode || 'NO CODE NEEDED'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold">TARGET ACTION:</span>
                    <span className="text-pink-300 font-bold text-xs uppercase">
                      Tab: {offer.actionTab}
                    </span>
                  </div>
                </div>

                {/* Control Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setPreviewOffer(offer)}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-purple-500/30"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditForm(offer)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="Edit Offer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(offer.id, offer.title)}
                      className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all cursor-pointer border border-red-500/30"
                      title="Delete Offer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD / EDIT OFFER POPUP MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-pink-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingOffer ? 'Edit Offer Popup' : 'Create New Promotional Offer'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure popup appearance, banner, promo code and action redirection
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    1. Offer Headline / Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 🎉 Mega Bumper Deposit Offer"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-400"
                  />
                </div>

                {/* Subtitle */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    2. Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. 10% Extra on Every Recharge!"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-400"
                  />
                </div>

                {/* Badge Text */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    3. Floating Badge Tag
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="e.g. 🔥 HOT OFFER / 🎁 FESTIVAL"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-400"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    4. Description Details (विस्तार से जानकारी)
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the offer conditions, bonus rules, and match details..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-pink-400"
                  />
                </div>

                {/* Banner Graphic Image URL */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase flex items-center justify-between">
                    <span>5. Banner Graphic Image URL</span>
                    <span className="text-[10px] text-pink-300">Choose Preset or Custom URL</span>
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-pink-400"
                  />

                  {/* Preset Banner Selectors */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {PRESET_BANNERS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className={`p-1.5 rounded-xl border text-[10px] font-bold text-left transition-all flex items-center gap-1.5 cursor-pointer ${
                          imageUrl === preset.url
                            ? 'bg-pink-500/20 border-pink-400 text-pink-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-7 h-7 rounded-lg object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Promo Code */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    6. Promo Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="e.g. TAMBOLA100"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-amber-300 font-mono font-bold uppercase focus:outline-none focus:border-pink-400"
                  />
                </div>

                {/* Benefit Highlight Strip Text */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    7. Benefit Highlight Text
                  </label>
                  <input
                    type="text"
                    value={discountOrBonusText}
                    onChange={(e) => setDiscountOrBonusText(e.target.value)}
                    placeholder="e.g. 10% Instant Bonus Unlock"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-400"
                  />
                </div>

                {/* CTA Action Button Label */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    8. CTA Button Label
                  </label>
                  <input
                    type="text"
                    value={actionText}
                    onChange={(e) => setActionText(e.target.value)}
                    placeholder="e.g. Add Money Now (रिचार्ज करें)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-400"
                  />
                </div>

                {/* Target App Tab */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    9. Redirect Target Page
                  </label>
                  <select
                    value={actionTab}
                    onChange={(e) => setActionTab(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-400 cursor-pointer"
                  >
                    <option value="wallet">Wallet / Recharge (डिपोजिट पेज)</option>
                    <option value="games">Games Lobby (गेम्स लॉबी)</option>
                    <option value="live">Live Game Room (लाइव रूम)</option>
                    <option value="referral">Referral / Invite (रेफरल)</option>
                    <option value="daily_bonus">Daily Bonus &amp; Scratch (दैनिक बोनस)</option>
                  </select>
                </div>

                {/* Toggles */}
                <div className="space-y-2 sm:col-span-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <div>
                      <div className="text-xs font-bold text-white">Active Status (ऑफर चालू रखें)</div>
                      <div className="text-[10px] text-slate-400">If disabled, offer will not be visible to players.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${
                        isActive ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                          isActive ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <div>
                      <div className="text-xs font-bold text-white">Show on App Launch (ऐप खुलते ही पॉपअप दिखाएं)</div>
                      <div className="text-[10px] text-slate-400">Automatically display when player opens home or dashboard.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowOnAppLaunch(!showOnAppLaunch)}
                      className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${
                        showOnAppLaunch ? 'bg-amber-400' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-slate-950 absolute top-1 transition-all ${
                          showOnAppLaunch ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-slate-950 font-black text-xs shadow-lg shadow-pink-500/25 cursor-pointer"
                >
                  {editingOffer ? 'Update Offer Popup' : 'Save & Publish Offer Popup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {previewOffer && (
        <OfferPopupModal
          offer={previewOffer}
          isOpen={true}
          onClose={() => setPreviewOffer(null)}
          onAction={() => setPreviewOffer(null)}
        />
      )}
    </div>
  );
};
