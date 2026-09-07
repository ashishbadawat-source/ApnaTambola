/**
 * Universal Safe Storage Helper for Cross-Browser Compatibility
 * Works flawlessly in Safari (including Private Browsing), Chrome, Firefox, Edge, and iOS/Android WebViews.
 * Falls back to an in-memory storage dictionary if localStorage is restricted or quota exceeded.
 */

const memoryFallback: Record<string, string> = {};

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch (e) {
      // SecurityError or restricted in Safari private browsing
    }
    return memoryFallback[key] !== undefined ? memoryFallback[key] : null;
  },

  setItem: (key: string, value: string): boolean => {
    try {
      memoryFallback[key] = value;
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return true;
      }
    } catch (e) {
      // QuotaExceededError or SecurityError
      console.warn(`safeStorage: localStorage.setItem failed for key "${key}", using memory fallback.`);
    }
    return false;
  },

  removeItem: (key: string): boolean => {
    try {
      delete memoryFallback[key];
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return true;
      }
    } catch (e) {
      // Ignore
    }
    return false;
  },

  clear: (): void => {
    try {
      Object.keys(memoryFallback).forEach((k) => delete memoryFallback[k]);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (e) {
      // Ignore
    }
  },
};

/**
 * Universal clipboard copy helper that works across Safari, Firefox, Chrome, Edge, and iframe embeds.
 */
export async function safeCopyText(text: string): Promise<boolean> {
  if (!text) return false;
  
  // 1. Try modern navigator.clipboard API
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // Falls through to fallback
  }

  // 2. Legacy execCommand textarea fallback for Safari/iOS and iframe contexts
  try {
    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999); // Mobile compatibility
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.warn('safeCopyText fallback error:', err);
  }

  return false;
}
