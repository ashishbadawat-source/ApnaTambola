import React from 'react';
import { X, Sparkles, Check, Crown, Palette, Flame, ShieldCheck } from 'lucide-react';
import { AppTemplateId, TEMPLATE_LIST, AppTemplateConfig } from '../utils/appThemes';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplateId: AppTemplateId;
  onSelectTemplate: (templateId: AppTemplateId) => void;
}

export const TemplateSelectorModal: React.FC<TemplateSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTemplateId,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl glass-panel-gold rounded-3xl border-2 border-amber-500/40 p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>अपना तंबोला - सुंदर टेम्पलेट चुनें</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold">
                  Themes &amp; Templates
                </span>
              </h2>
              <p className="text-xs text-amber-200/80">
                Choose your favorite visual theme &amp; luxury casino look
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {TEMPLATE_LIST.map((template: AppTemplateConfig) => {
            const isSelected = currentTemplateId === template.id;

            return (
              <div
                key={template.id}
                onClick={() => {
                  onSelectTemplate(template.id);
                  onClose();
                }}
                className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-300 border-2 text-left group overflow-hidden ${
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-400/60 shadow-xl shadow-amber-500/20 bg-slate-900/90 scale-[1.02]'
                    : 'border-slate-800 hover:border-slate-600 bg-slate-950/70 hover:bg-slate-900/60'
                }`}
              >
                {/* Top preview swatch */}
                <div className={`h-10 rounded-xl bg-gradient-to-r ${template.previewBg} p-2 flex items-center justify-between text-slate-950 font-black text-xs shadow-inner mb-3`}>
                  <div className="flex items-center gap-1.5 text-white drop-shadow-md">
                    <span className="text-lg">{template.icon}</span>
                    <span className="font-bold tracking-wide">{template.name}</span>
                  </div>
                  {isSelected ? (
                    <span className="px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black flex items-center gap-1 shadow-md border border-amber-400/40">
                      <Check className="w-3 h-3 text-amber-400 stroke-[3]" /> सक्रिय (Active)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-black/40 text-white text-[10px] font-bold">
                      Preview
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-slate-100 text-sm flex items-center gap-1.5">
                      <span>{template.nameHi}</span>
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${template.badgeColor}`}>
                      {(template.id || '').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {template.taglineHi}
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                    {template.tagline}
                  </p>
                </div>

                {/* Color accents display */}
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Number Board &amp; Ticket Sync</span>
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded-full ring-1 ring-white/20" style={{ background: template.ticketPerforationColor }} />
                    <span className="w-3.5 h-3.5 rounded-full ring-1 ring-white/20" style={{ background: template.hologramColor }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info note */}
        <div className="bg-amber-950/30 rounded-2xl p-3 border border-amber-500/20 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>चुना हुआ टेम्पलेट आपके पूरे गेम, नंबर बोर्ड और टिकटों पर तुरंत लागू हो जाएगा।</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black hover:opacity-90 transition-opacity shrink-0 ml-3"
          >
            लागू करें (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
