import { BrevoEmailSettings, EmailEventType, EmailLogEntry } from '../types';

export interface SendEmailPayload {
  eventType: EmailEventType;
  recipientEmail: string;
  recipientName?: string;
  data?: Record<string, any>;
}

export interface EmailApiResponse {
  success: boolean;
  message?: string;
  messageId?: string;
  log?: EmailLogEntry;
  error?: string;
  deliveryMethod?: 'brevo_api' | 'smtp' | 'simulated';
}

export async function fetchEmailSettings(): Promise<BrevoEmailSettings | null> {
  try {
    const res = await fetch('/api/email/settings');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn('Failed to fetch email settings from server, using fallback:', error);
    return null;
  }
}

export async function saveEmailSettings(
  settings: Partial<BrevoEmailSettings>
): Promise<{ success: boolean; settings?: BrevoEmailSettings; error?: string }> {
  try {
    const res = await fetch('/api/email/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save settings');
    return { success: true, settings: data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to save settings' };
  }
}

export async function sendTransactionalEmail(payload: SendEmailPayload): Promise<EmailApiResponse> {
  try {
    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to send email' };
    }
    return data;
  } catch (error: any) {
    console.error('sendTransactionalEmail failed:', error);
    return { success: false, error: error.message || 'Network error while sending email' };
  }
}

export async function sendTestEmail(
  eventType: EmailEventType,
  recipientEmail: string,
  customData?: Record<string, any>
): Promise<EmailApiResponse> {
  try {
    const res = await fetch('/api/email/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, recipientEmail, data: customData }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to send test email' };
    }
    return data;
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error while sending test email' };
  }
}

export async function fetchEmailLogs(): Promise<EmailLogEntry[]> {
  try {
    const res = await fetch('/api/email/logs');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Failed to fetch email logs:', error);
    return [];
  }
}

export async function retryEmail(logId: string): Promise<EmailApiResponse> {
  try {
    const res = await fetch(`/api/email/retry/${logId}`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to retry email');
    return data;
  } catch (error: any) {
    return { success: false, error: error.message || 'Error retrying email' };
  }
}

export async function clearAllEmailLogs(): Promise<boolean> {
  try {
    const res = await fetch('/api/email/logs', { method: 'DELETE' });
    return res.ok;
  } catch (error) {
    console.warn('Failed to clear email logs:', error);
    return false;
  }
}
