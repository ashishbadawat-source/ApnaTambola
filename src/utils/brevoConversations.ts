// Brevo Conversations Live Chat Helper & Synchronizer
import { User } from '../types';

export const BREVO_CONVERSATIONS_ID = '6a89986bde06c1370604dacf';

declare global {
  interface Window {
    BrevoConversationsID?: string;
    BrevoConversations?: {
      (...args: any[]): void;
      q?: any[];
    };
  }
}

// Initialize Brevo Conversations script dynamically if not already loaded
export const initBrevoConversations = (conversationsId = BREVO_CONVERSATIONS_ID) => {
  if (typeof window === 'undefined') return;
  if (document.getElementById('brevo-conversations-script')) return;

  try {
    window.BrevoConversationsID = conversationsId;
    window.BrevoConversations =
      window.BrevoConversations ||
      function () {
        (window.BrevoConversations!.q = window.BrevoConversations!.q || []).push(arguments);
      };

    const script = document.createElement('script');
    script.id = 'brevo-conversations-script';
    script.async = true;
    script.src = 'https://conversations-widget.brevo.com/brevo-conversations.js';
    script.onerror = () => {
      console.warn('Brevo conversations widget script failed to load.');
    };
    if (document.head) {
      document.head.appendChild(script);
    }
  } catch (err) {
    console.warn('Error initializing Brevo Conversations:', err);
  }
};

// Open Brevo live chat window
export const openBrevoChat = () => {
  if (typeof window === 'undefined') return;

  try {
    if (typeof window.BrevoConversations === 'function') {
      window.BrevoConversations('openChat');
    }
  } catch (e) {
    console.warn('Could not open Brevo chat window:', e);
  }
};

// Synchronize current logged-in player / user info with Brevo Conversations
export const syncUserToBrevoConversations = (user: User | null) => {
  if (typeof window === 'undefined' || typeof window.BrevoConversations !== 'function') return;

  try {
    if (user) {
      const userEmail = user.email || `${user.phone}@apnatambola.com`;
      window.BrevoConversations('setUser', {
        id: user.id,
        email: userEmail,
        name: user.name,
        phone: user.phone,
        role: user.role,
        walletBalance: `₹${user.walletBalance || 0}`,
        winningBalance: `₹${user.winningBalance || 0}`,
        referralCode: user.referralCode || 'N/A',
      });
    }
  } catch (e) {
    console.warn('Error syncing user to Brevo conversations:', e);
  }
};
