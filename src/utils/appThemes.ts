export type AppTemplateId = 'royal_gold' | 'festive_mela' | 'cyber_neon' | 'vintage_club' | 'kohinoor_diamond';

export interface AppTemplateConfig {
  id: AppTemplateId;
  name: string;
  nameHi: string;
  tagline: string;
  taglineHi: string;
  icon: string;
  previewBg: string;
  previewBorder: string;
  badgeColor: string;
  bodyBgClass: string;
  navbarBgClass: string;
  cardGlassClass: string;
  accentGradient: string;
  accentText: string;
  heroBannerBg: string;
  ticketPerforationColor: string;
  hologramColor: string;
  numberBoardTheme: {
    boardBg: string;
    calledBg: string;
    calledText: string;
    currentBg: string;
    uncalledBg: string;
    uncalledText: string;
  };
}

export const APP_TEMPLATES: Record<AppTemplateId, AppTemplateConfig> = {
  royal_gold: {
    id: 'royal_gold',
    name: 'Royal Gold Palace',
    nameHi: 'शाही स्वर्ण महल',
    tagline: '24K Gold luxury casino with velvet navy & amber radiance',
    taglineHi: '24 कैरेट शाही सोने की चमक और रॉयल नेवी थीम',
    icon: '👑',
    previewBg: 'from-amber-600 via-yellow-500 to-amber-800',
    previewBorder: 'border-amber-400',
    badgeColor: 'bg-amber-400 text-slate-950',
    bodyBgClass: 'theme-royal-gold',
    navbarBgClass: 'bg-slate-950/90 border-amber-500/30 shadow-amber-500/10',
    cardGlassClass: 'glass-panel-gold',
    accentGradient: 'from-amber-400 via-yellow-300 to-amber-500',
    accentText: 'text-amber-300',
    heroBannerBg: 'bg-gradient-to-r from-amber-950/80 via-slate-950 to-amber-950/80 border-amber-500/40',
    ticketPerforationColor: '#f59e0b',
    hologramColor: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #3b82f6 100%)',
    numberBoardTheme: {
      boardBg: 'bg-slate-950/90 border-amber-500/30',
      calledBg: 'bg-gradient-to-br from-amber-500 to-amber-700',
      calledText: 'text-slate-950 font-black',
      currentBg: 'bg-gradient-to-br from-yellow-300 to-amber-400 text-slate-950 ring-4 ring-amber-300',
      uncalledBg: 'bg-slate-900/90 border-slate-800',
      uncalledText: 'text-slate-400',
    },
  },

  festive_mela: {
    id: 'festive_mela',
    name: 'Festive Peacock Mela',
    nameHi: 'उत्सव मेला दिवाली',
    tagline: 'Vibrant peacock green, royal saffron and festive Indian celebration',
    taglineHi: 'मयूर पंख हरा, केसरी और दीपावली उत्सव का माहौल',
    icon: '🦚',
    previewBg: 'from-emerald-600 via-teal-500 to-orange-500',
    previewBorder: 'border-emerald-400',
    badgeColor: 'bg-emerald-400 text-slate-950',
    bodyBgClass: 'theme-festive-mela',
    navbarBgClass: 'bg-[#061914]/90 border-emerald-500/30 shadow-emerald-500/10',
    cardGlassClass: 'glass-panel-emerald',
    accentGradient: 'from-emerald-400 via-teal-300 to-amber-400',
    accentText: 'text-emerald-300',
    heroBannerBg: 'bg-gradient-to-r from-emerald-950/80 via-slate-950 to-orange-950/80 border-emerald-500/40',
    ticketPerforationColor: '#10b981',
    hologramColor: 'linear-gradient(135deg, #10b981 0%, #f59e0b 50%, #8b5cf6 100%)',
    numberBoardTheme: {
      boardBg: 'bg-[#061914]/95 border-emerald-500/30',
      calledBg: 'bg-gradient-to-br from-emerald-600 to-teal-700',
      calledText: 'text-white font-black',
      currentBg: 'bg-gradient-to-br from-orange-400 to-amber-400 text-slate-950 ring-4 ring-emerald-300',
      uncalledBg: 'bg-slate-900/90 border-emerald-950',
      uncalledText: 'text-slate-400',
    },
  },

  cyber_neon: {
    id: 'cyber_neon',
    name: 'Cyber Vegas Neon',
    nameHi: 'साइबर लास वेगास',
    tagline: 'High-octane neon cyan & magenta synthwave tournament theme',
    taglineHi: 'अल्ट्रा मॉडर्न लास वेगास नियॉन और साइबरपंक टूर्नामेंट थीम',
    icon: '🌌',
    previewBg: 'from-cyan-500 via-purple-600 to-fuchsia-500',
    previewBorder: 'border-cyan-400',
    badgeColor: 'bg-cyan-400 text-slate-950',
    bodyBgClass: 'theme-cyber-neon',
    navbarBgClass: 'bg-[#090b1c]/90 border-cyan-500/30 shadow-cyan-500/10',
    cardGlassClass: 'glass-panel-purple',
    accentGradient: 'from-cyan-400 via-fuchsia-400 to-purple-400',
    accentText: 'text-cyan-300',
    heroBannerBg: 'bg-gradient-to-r from-purple-950/80 via-slate-950 to-cyan-950/80 border-cyan-500/40',
    ticketPerforationColor: '#06b6d4',
    hologramColor: 'linear-gradient(135deg, #06b6d4 0%, #d946ef 50%, #eab308 100%)',
    numberBoardTheme: {
      boardBg: 'bg-[#090b1c]/95 border-cyan-500/30',
      calledBg: 'bg-gradient-to-br from-purple-600 to-pink-600',
      calledText: 'text-white font-black',
      currentBg: 'bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 ring-4 ring-cyan-300',
      uncalledBg: 'bg-slate-900/90 border-purple-950',
      uncalledText: 'text-slate-400',
    },
  },

  vintage_club: {
    id: 'vintage_club',
    name: 'Vintage Club Heritage',
    nameHi: 'क्लासिक क्लब हेरिटेज',
    tagline: 'Classic British & Gymkhana club housie with wooden counter tokens',
    taglineHi: 'जिमखाना क्लब और पारंपरिक लकड़ी के कॉइन वाला क्लासिक अंदाज',
    icon: '📜',
    previewBg: 'from-amber-700 via-orange-800 to-stone-900',
    previewBorder: 'border-amber-600',
    badgeColor: 'bg-amber-600 text-white',
    bodyBgClass: 'theme-vintage-club',
    navbarBgClass: 'bg-[#18110a]/95 border-amber-700/40 shadow-amber-900/20',
    cardGlassClass: 'glass-panel-vintage',
    accentGradient: 'from-amber-300 via-orange-300 to-yellow-400',
    accentText: 'text-amber-200',
    heroBannerBg: 'bg-gradient-to-r from-[#2a1a0f] via-[#1a110a] to-[#2a1a0f] border-amber-700/50',
    ticketPerforationColor: '#d97706',
    hologramColor: 'linear-gradient(135deg, #d97706 0%, #78350f 50%, #fbbf24 100%)',
    numberBoardTheme: {
      boardBg: 'bg-[#1a110a]/95 border-amber-800/40',
      calledBg: 'bg-gradient-to-br from-amber-700 to-orange-800',
      calledText: 'text-amber-100 font-bold',
      currentBg: 'bg-gradient-to-br from-yellow-500 to-amber-600 text-slate-950 ring-4 ring-amber-400',
      uncalledBg: 'bg-[#120c07] border-stone-800',
      uncalledText: 'text-stone-400',
    },
  },

  kohinoor_diamond: {
    id: 'kohinoor_diamond',
    name: 'Kohinoor Diamond Luxury',
    nameHi: 'कोहिनूर डायमंड प्लैटिनम',
    tagline: 'Ultra-luxurious frosted platinum crystal & sparkling diamond brilliance',
    taglineHi: 'कोहिनूर हीरे जैसी चमक, प्लैटिनम और अल्ट्रा-प्रीमियम फील',
    icon: '💎',
    previewBg: 'from-slate-300 via-indigo-200 to-slate-400',
    previewBorder: 'border-slate-300',
    badgeColor: 'bg-slate-200 text-slate-950',
    bodyBgClass: 'theme-kohinoor-diamond',
    navbarBgClass: 'bg-[#0f172a]/95 border-indigo-300/30 shadow-indigo-500/10',
    cardGlassClass: 'glass-panel-platinum',
    accentGradient: 'from-indigo-200 via-white to-indigo-300',
    accentText: 'text-indigo-200',
    heroBannerBg: 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-400/40',
    ticketPerforationColor: '#cbd5e1',
    hologramColor: 'linear-gradient(135deg, #e0e7ff 0%, #c084fc 50%, #38bdf8 100%)',
    numberBoardTheme: {
      boardBg: 'bg-[#0f172a]/95 border-indigo-300/30',
      calledBg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      calledText: 'text-white font-black',
      currentBg: 'bg-gradient-to-br from-white to-indigo-200 text-slate-950 ring-4 ring-indigo-300',
      uncalledBg: 'bg-slate-900/90 border-slate-700',
      uncalledText: 'text-slate-400',
    },
  },
};

export const TEMPLATE_LIST = Object.values(APP_TEMPLATES);

export function getAppTemplate(id?: string): AppTemplateConfig {
  if (id && id in APP_TEMPLATES) {
    return APP_TEMPLATES[id as AppTemplateId];
  }
  return APP_TEMPLATES.royal_gold;
}
