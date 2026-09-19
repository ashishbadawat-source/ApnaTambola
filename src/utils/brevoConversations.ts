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

export const syncUserToBrevoConversations = (_user: User | null) => {
  // disabled
};

// Remove Brevo widget elements completely
export const removeBrevoWidget = () => {
  if (typeof window === 'undefined') return;
  try {
    const script = document.getElementById('brevo-conversations-script');
    if (script) script.remove();
    document.querySelectorAll('[id*="brevo"], [class*="brevo"], iframe[src*="brevo"], #chat-widget-container').forEach((el) => {
      try {
        el.remove();
      } catch (e) {}
    });
  } catch (e) {}
};

