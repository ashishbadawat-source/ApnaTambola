// Tawk.to Live Chat helper and visitor attributes synchronizer
import { User } from '../types';

export const TAWK_SITE_ID = '671ba0224304e3196ad82413';
export const TAWK_DIRECT_CHAT_URL = `https://tawk.to/chat/${TAWK_SITE_ID}/default`;
export const TICKET_EMAIL = 'tickets@click-earn-hvfde7.p.tawk.email';

declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void;
      minimize?: () => void;
      toggle?: () => void;
      popup?: () => void;
      showWidget?: () => void;
      hideWidget?: () => void;
      setAttributes?: (attributes: Record<string, any>, callback?: (error?: any) => void) => void;
      visitor?: {
        name?: string;
        email?: string;
        hash?: string;
      };
      onLoad?: () => void;
      onChatStarted?: () => void;
      onChatEnded?: () => void;
      getStatus?: () => 'online' | 'away' | 'offline';
    };
    Tawk_LoadStart?: Date;
    $_Tawk?: any;
  }
}

// Safely initialize $_Tawk fallback stubs to prevent third-party i18next script exceptions
if (typeof window !== 'undefined') {
  try {
    window.$_Tawk = window.$_Tawk || {};
    if (typeof window.$_Tawk.i18next !== 'function') {
      window.$_Tawk.i18next = {
        t: (k: string) => k,
        init: () => {},
        use: () => window.$_Tawk?.i18next,
        changeLanguage: () => {},
      };
    }
    // Stub tawk logger to suppress internal sandbox noise
    window.$_Tawk.logger = {
      log: () => {},
      warn: () => {},
      error: () => {},
    };
  } catch (e) {
    // Ignore sandbox errors
  }
}

export const initTawkScript = (siteId = TAWK_SITE_ID) => {
  if (typeof window === 'undefined') return;
  if (document.getElementById('tawk-script-tag')) return;

  try {
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Ensure fallback exists before script execution
    window.$_Tawk = window.$_Tawk || {};
    if (typeof window.$_Tawk.i18next !== 'function') {
      window.$_Tawk.i18next = {
        t: (k: string) => k,
        init: () => {},
        use: () => window.$_Tawk?.i18next,
      };
    }
    window.$_Tawk.logger = {
      log: () => {},
      warn: () => {},
      error: () => {},
    };

    const script = document.createElement('script');
    script.id = 'tawk-script-tag';
    script.async = true;
    script.src = `https://embed.tawk.to/${siteId}/default`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    script.onerror = () => {
      // Handled silently
    };
    document.head.appendChild(script);
  } catch (err) {
    // Handled silently
  }
};

export const openTawkChat = () => {
  if (typeof window === 'undefined') return;

  try {
    // If Tawk widget is fully initialized on page
    if (window.Tawk_API && typeof window.Tawk_API.maximize === 'function') {
      window.Tawk_API.showWidget?.();
      window.Tawk_API.maximize();
      return;
    }

    if (window.Tawk_API && typeof window.Tawk_API.toggle === 'function') {
      window.Tawk_API.showWidget?.();
      window.Tawk_API.toggle();
      return;
    }

    // Direct web chat link as seamless fallback
    const chatWindow = window.open(
      TAWK_DIRECT_CHAT_URL,
      'TawkLiveChat',
      'width=450,height=650,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes'
    );
    if (!chatWindow) {
      window.location.href = TAWK_DIRECT_CHAT_URL;
    }
  } catch (e) {
    // If popup is blocked, open directly
    window.open(TAWK_DIRECT_CHAT_URL, '_blank');
  }
};

export const syncUserToTawk = (user: User | null) => {
  if (typeof window === 'undefined' || !window.Tawk_API) return;

  try {
    if (user) {
      const userEmail = user.email || `${user.phone}@tambolalive.in`;
      if (typeof window.Tawk_API.setAttributes === 'function') {
        window.Tawk_API.setAttributes(
          {
            name: user.name,
            email: userEmail,
            phone: user.phone,
            userId: user.id,
            role: user.role,
            walletBalance: `₹${user.walletBalance || 0}`,
            referralCode: user.referralCode || 'N/A',
          },
          function (err) {
            if (err) console.warn('Tawk attribute sync notice:', err);
          }
        );
      }
      if (window.Tawk_API.visitor) {
        window.Tawk_API.visitor = {
          name: user.name,
          email: userEmail,
        };
      }
    }
  } catch (e) {
    console.warn('Tawk sync error:', e);
  }
};
