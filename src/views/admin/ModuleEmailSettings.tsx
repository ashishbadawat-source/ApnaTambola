import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Eye,
  Settings,
  Sparkles,
  ShieldCheck,
  Zap,
  Flame,
  FileText,
  RotateCcw,
  Sliders,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  Info,
  Smartphone,
  Monitor,
  Trash2,
  Lock,
  EyeOff,
} from 'lucide-react';
import {
  BrevoEmailSettings,
  EmailEventType,
  EmailLogEntry,
  EmailTemplateDefinition,
} from '../../types';
import { EMAIL_TEMPLATE_DEFINITIONS, generateEmailHtml } from '../../utils/emailTemplates';
import {
  fetchEmailSettings,
  saveEmailSettings,
  sendTestEmail,
  fetchEmailLogs,
  retryEmail,
  clearAllEmailLogs,
} from '../../services/emailService';

interface ModuleEmailSettingsProps {
  adminEmail?: string;
}

export const ModuleEmailSettings: React.FC<ModuleEmailSettingsProps> = ({
  adminEmail = 'ashishbadawat@gmail.com',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'events' | 'templates' | 'test' | 'logs'>('settings');
  const [settings, setSettings] = useState<BrevoEmailSettings | null>(null);
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Settings State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [senderNameInput, setSenderNameInput] = useState('');
  const [senderEmailInput, setSenderEmailInput] = useState('');
  const [smtpHostInput, setSmtpHostInput] = useState('smtp-relay.brevo.com');
  const [smtpPortInput, setSmtpPortInput] = useState(587);
  const [smtpUserInput, setSmtpUserInput] = useState('');
  const [smtpPassInput, setSmtpPassInput] = useState('');
  const [footerTextInput, setFooterTextInput] = useState('');
  const [supportPhoneInput, setSupportPhoneInput] = useState('');

  // Event Toggles
  const [eventToggles, setEventToggles] = useState<Record<EmailEventType, boolean>>({
    user_registration: true,
    email_verification: true,
    password_reset: true,
    ticket_purchase: true,
    game_start: true,
    winning: true,
    withdrawal_request: true,
    withdrawal_status: true,
    wallet_transaction: true,
    referral_commission: true,
  });

  // Template Studio
  const [selectedTemplateId, setSelectedTemplateId] = useState<EmailEventType>('winning');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [customSubjects, setCustomSubjects] = useState<Record<EmailEventType, string>>({} as any);

  // Test Email
  const [testRecipient, setTestRecipient] = useState(adminEmail);
  const [testTemplateId, setTestTemplateId] = useState<EmailEventType>('user_registration');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string; messageId?: string } | null>(null);

  // Logs & Preview Modal
  const [logFilter, setLogFilter] = useState<'all' | 'sent' | 'failed' | 'simulated'>('all');
  const [selectedLogPreview, setSelectedLogPreview] = useState<EmailLogEntry | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isRetryingId, setIsRetryingId] = useState<string | null>(null);

  // Load Settings & Logs
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedSettings, fetchedLogs] = await Promise.all([
        fetchEmailSettings(),
        fetchEmailLogs(),
      ]);

      if (fetchedSettings) {
        setSettings(fetchedSettings);
        setApiKeyInput(fetchedSettings.apiKey || '');
        setSenderNameInput(fetchedSettings.senderName || 'Apna Tambola Official');
        setSenderEmailInput(fetchedSettings.senderEmail || 'support@apnatambola.com');
        setSmtpHostInput(fetchedSettings.smtpHost || 'smtp-relay.brevo.com');
        setSmtpPortInput(fetchedSettings.smtpPort || 587);
        setSmtpUserInput(fetchedSettings.smtpUser || '');
        setSmtpPassInput(fetchedSettings.smtpPass || '');
        setFooterTextInput(fetchedSettings.footerText || '');
        setSupportPhoneInput(fetchedSettings.supportPhone || '+91 98765 43210');
        if (fetchedSettings.eventToggles) {
          setEventToggles(fetchedSettings.eventToggles);
        }
        if (fetchedSettings.customSubjects) {
          setCustomSubjects(fetchedSettings.customSubjects);
        }
      }

      if (fetchedLogs) {
        setLogs(fetchedLogs);
      }
    } catch (e) {
      console.warn('Error loading email data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const payload: Partial<BrevoEmailSettings> = {
        senderName: senderNameInput,
        senderEmail: senderEmailInput,
        smtpHost: smtpHostInput,
        smtpPort: smtpPortInput,
        smtpUser: smtpUserInput,
        smtpPass: smtpPassInput,
        footerText: footerTextInput,
        supportPhone: supportPhoneInput,
        eventToggles,
        customSubjects,
      };

      if (apiKeyInput && !apiKeyInput.includes('***')) {
        payload.apiKey = apiKeyInput.trim();
      }

      const res = await saveEmailSettings(payload);
      if (res.success && res.settings) {
        setSettings(res.settings);
        setSaveMessage({ type: 'success', text: '✅ Brevo Email settings saved successfully!' });
      } else {
        setSaveMessage({ type: 'error', text: `❌ ${res.error || 'Failed to save settings'}` });
      }
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: `❌ ${err.message || 'Error occurred'}` });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle single event
  const handleToggleEvent = (evt: EmailEventType) => {
    const updated = { ...eventToggles, [evt]: !eventToggles[evt] };
    setEventToggles(updated);
    saveEmailSettings({ eventToggles: updated });
  };

  // Toggle all events
  const handleToggleAllEvents = (enabled: boolean) => {
    const updated = { ...eventToggles };
    (Object.keys(updated) as EmailEventType[]).forEach((k) => {
      updated[k] = enabled;
    });
    setEventToggles(updated);
    saveEmailSettings({ eventToggles: updated });
  };

  // Send Test Email
  const handleSendTest = async () => {
    if (!testRecipient || !testRecipient.includes('@')) {
      setTestResult({ success: false, error: 'Please enter a valid recipient email address.' });
      return;
    }
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const sampleData: Record<string, any> = {
        userName: 'Ashish Badawat (Admin Test)',
        userEmail: testRecipient,
        bonusAmount: '50',
        referralCode: 'ASHISH99',
        otpCode: '782914',
        resetOtp: '481920',
        gameTitle: '₹50 Mega Bumper Jackpot',
        gameCode: 'TB-774',
        gameTime: 'Today at 09:00 PM',
        ticketCount: 2,
        ticketId: 'TKT-9824-712',
        totalPaid: '100',
        prizePool: '10,920',
        prizeName: 'Full House (1st)',
        winningAmount: '3,500',
        winningNumber: 76,
        walletBalance: '4,280',
        amount: '1,500',
        paymentMethod: 'Instant UPI (ashish@upi)',
        upiIdOrBank: 'ashish@upi',
        referenceId: `TEST-${Date.now().toString().slice(-6)}`,
        status: 'Approved',
        utrNumber: 'IMPS-9823019842',
        remarks: 'Processed via automated IMPS test',
        txnType: 'Wallet Recharge Deposit',
        balanceAfter: '2,450',
        commissionAmount: '25.00',
        level: 1,
        percentage: '4.0%',
        sourceUserName: 'Amit Patel',
        newReferralBalance: '1,840.50',
        date: new Date().toLocaleString(),
      };

      const res = await sendTestEmail(testTemplateId, testRecipient, sampleData);
      setTestResult(res);
      // Reload logs to reflect the new test log
      const updatedLogs = await fetchEmailLogs();
      setLogs(updatedLogs);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || 'Error triggering test email' });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Retry Failed Email
  const handleRetryEmail = async (logId: string) => {
    setIsRetryingId(logId);
    try {
      const res = await retryEmail(logId);
      if (res.success) {
        const updated = await fetchEmailLogs();
        setLogs(updated);
      }
    } catch (e) {
      console.warn('Retry failed:', e);
    } finally {
      setIsRetryingId(null);
    }
  };

  // Clear Logs
  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all transactional email logs?')) return;
    await clearAllEmailLogs();
    setLogs([]);
  };

  // Active Template definition for Studio
  const currentTemplateDef = EMAIL_TEMPLATE_DEFINITIONS.find((t) => t.id === selectedTemplateId) || EMAIL_TEMPLATE_DEFINITIONS[0];

  // Live HTML generation for preview
  const livePreview = generateEmailHtml(
    selectedTemplateId,
    {
      userName: 'Rahul Sharma',
      userEmail: 'rahul@example.com',
      bonusAmount: '50',
      referralCode: 'TAMBOLA99',
      otpCode: '582914',
      resetOtp: '739104',
      gameTitle: '₹50 Mega Bumper Jackpot',
      gameCode: 'TB-774',
      gameTime: 'Today at 09:00 PM',
      ticketCount: 2,
      ticketId: 'TKT-9824-712',
      totalPaid: '100',
      prizePool: '10,920',
      prizeName: 'Full House (1st)',
      winningAmount: '3,500',
      winningNumber: 76,
      walletBalance: '4,280',
      amount: '1,500',
      paymentMethod: 'Instant UPI',
      upiIdOrBank: 'rahul@okaxis',
      referenceId: 'WDR-9812-441',
      status: 'Approved',
      utrNumber: 'IMPS-9823019842',
      remarks: 'Processed via automated IMPS',
      txnType: 'Wallet Deposit',
      balanceAfter: '1,250',
      commissionAmount: '25.00',
      level: 1,
      percentage: '4.0%',
      sourceUserName: 'Amit Patel',
      newReferralBalance: '1,840.50',
      date: new Date().toLocaleString(),
    },
    {
      senderName: senderNameInput || settings?.senderName,
      footerText: footerTextInput || settings?.footerText,
      supportPhone: supportPhoneInput || settings?.supportPhone,
    }
  );

  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'all') return true;
    if (logFilter === 'sent') return log.status === 'sent' || log.status === 'delivered';
    if (logFilter === 'failed') return log.status === 'failed';
    if (logFilter === 'simulated') return log.status === 'simulated';
    return true;
  });

  const enabledCount = Object.values(eventToggles).filter(Boolean).length;
  const failedLogsCount = logs.filter((l) => l.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#1c1236] via-[#161b3d] to-[#250d24] p-5 sm:p-6 border-2 border-amber-400/50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                FREE BREVO SMTP / API ENGINE
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] px-2 py-0.5 rounded-full font-bold">
                ✓ 300 Free Emails / Day
              </span>
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] px-2 py-0.5 rounded-full font-bold">
                10 Automated Events
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <span>Transactional Email Governance</span>
              <Mail className="w-6 h-6 text-amber-400" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Send instant high-converting transactional notifications (Welcome, OTP, Tickets, Wins, Payouts, Commissions) via Brevo's cloud infrastructure.
            </p>
          </div>

          {/* Quick Connection Status Badge */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full animate-pulse ${
                settings?.isConfigured ? 'bg-emerald-400 ring-4 ring-emerald-400/20' : 'bg-amber-400 ring-4 ring-amber-400/20'
              }`}
            />
            <div>
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <span>{settings?.isConfigured ? 'Brevo Cloud API Connected' : 'Sandbox / Simulation Active'}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {settings?.emailsSentToday || 0} / {settings?.dailyLimit || 300} Sent Today
              </div>
            </div>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'settings', label: '1. Brevo & Sender Setup', icon: Settings },
            { id: 'events', label: `2. Event Toggles (${enabledCount}/10)`, icon: Sliders, badge: `${enabledCount}/10` },
            { id: 'templates', label: '3. Template Studio & Preview', icon: FileText },
            { id: 'test', label: '4. Send Test Email', icon: Send },
            { id: 'logs', label: `5. Email Logs (${logs.length})`, icon: Clock, badge: failedLogsCount > 0 ? `${failedLogsCount} Failed` : null, badgeColor: 'bg-red-500 text-white' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                      tab.badgeColor || (isActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300')
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: Brevo API & Sender Settings */}
      {activeSubTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-black text-white">Brevo API & SMTP Credentials</h2>
                </div>
                <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Free 300 Emails/Day
                </span>
              </div>

              {saveMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    saveMessage.type === 'success'
                      ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300'
                      : 'bg-red-950/80 border border-red-500 text-red-300'
                  }`}
                >
                  {saveMessage.text}
                </div>
              )}

              {/* API Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    Brevo API Key (REST v3) <span className="text-amber-400">*</span>
                  </label>
                  <a
                    href="https://app.brevo.com/settings/keys/api"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Free API Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Stored securely on backend. Never exposed to browser or client code.
                </p>
              </div>

              {/* Sender Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Sender Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={senderNameInput}
                    onChange={(e) => setSenderNameInput(e.target.value)}
                    placeholder="Apna Tambola Official"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Sender Email <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={senderEmailInput}
                    onChange={(e) => setSenderEmailInput(e.target.value)}
                    placeholder="support@apnatambola.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-slate-400">
                    Must be a verified sender inside your Brevo dashboard.
                  </p>
                </div>
              </div>

              {/* SMTP Relay Details */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                    Optional SMTP Relay Configuration
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">SMTP Host</label>
                    <input
                      type="text"
                      value={smtpHostInput}
                      onChange={(e) => setSmtpHostInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">SMTP Port</label>
                    <input
                      type="number"
                      value={smtpPortInput}
                      onChange={(e) => setSmtpPortInput(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">SMTP Username (Email)</label>
                    <input
                      type="text"
                      value={smtpUserInput}
                      onChange={(e) => setSmtpUserInput(e.target.value)}
                      placeholder="e.g. 78a1bc@smtp-brevo.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">SMTP Password</label>
                    <input
                      type="password"
                      value={smtpPassInput}
                      onChange={(e) => setSmtpPassInput(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Branding & Helpline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Support Helpline</label>
                  <input
                    type="text"
                    value={supportPhoneInput}
                    onChange={(e) => setSupportPhoneInput(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Email Footer Notice</label>
                  <input
                    type="text"
                    value={footerTextInput}
                    onChange={(e) => setFooterTextInput(e.target.value)}
                    placeholder="India’s #1 Real-Time Multiplayer Housie Tournament Portal."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Email Configuration</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('test')}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Send Test Email</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Quick Guide & Integration Tips */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-900/40 p-5 space-y-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-sm font-black text-white">How to Get Free Brevo Key</h3>
              </div>
              <ol className="text-xs text-slate-300 space-y-2.5 list-decimal list-inside leading-relaxed">
                <li>
                  Sign up for a 100% free account at <strong className="text-white">brevo.com</strong>.
                </li>
                <li>
                  Go to <strong className="text-amber-400">SMTP & API</strong> in settings.
                </li>
                <li>
                  Click on <strong className="text-white">Generate a new API key</strong>.
                </li>
                <li>
                  Verify your sender email domain (e.g. <strong className="text-slate-200">contact@yourdomain.com</strong> or Gmail).
                </li>
                <li>
                  Paste the generated key into the field on the left and click <strong className="text-amber-400">Save</strong>.
                </li>
              </ol>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-sm font-black text-white">Security Guarantees</h3>
              </div>
              <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Zero Client Exposure:</strong> All keys stay on the backend server.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Fallback Sandbox:</strong> In test environments, emails simulate instant delivery without failure.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Audit Logs:</strong> Complete message history and bounce tracking.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: 10 Notification Event Master Toggles */}
      {activeSubTab === 'events' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span>10 Transactional Notification Triggers</span>
                  <Sliders className="w-5 h-5 text-amber-400" />
                </h2>
                <p className="text-xs text-slate-400">
                  Instantly enable or disable individual automated email events sent to players.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAllEvents(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 cursor-pointer"
                >
                  Enable All
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAllEvents(false)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold border border-red-500/30 cursor-pointer"
                >
                  Disable All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {EMAIL_TEMPLATE_DEFINITIONS.map((tpl, idx) => {
                const isEnabled = eventToggles[tpl.id] !== false;
                return (
                  <div
                    key={tpl.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isEnabled
                        ? 'bg-slate-950/80 border-slate-700/80 shadow-md'
                        : 'bg-slate-950/30 border-slate-800/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                            {tpl.category}
                          </span>
                          <span className="text-xs font-bold text-white">{tpl.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {tpl.description}
                        </p>
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-sm">
                          Subject: {tpl.defaultSubject}
                        </div>
                      </div>

                      {/* Switch Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleEvent(tpl.id)}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                          isEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform transform absolute top-0.5 ${
                            isEnabled ? 'left-6.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Email Template Studio & Live Preview */}
      {activeSubTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left List (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Select Template to Inspect
              </h3>
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {EMAIL_TEMPLATE_DEFINITIONS.map((tpl) => {
                  const isSelected = selectedTemplateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                          : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800/60'
                      }`}
                    >
                      <div className="truncate">
                        <div>{tpl.name}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                          {tpl.category}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-slate-950' : 'text-slate-500'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template Variables Card */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
              <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                <span>Supported Dynamic Variables</span>
              </h4>
              <div className="space-y-1.5 text-xs">
                {currentTemplateDef.supportedVariables.map((v) => (
                  <div key={v.key} className="flex items-center justify-between p-1.5 rounded bg-slate-950 border border-slate-800">
                    <span className="font-mono text-amber-400 font-bold">{`{{${v.key}}}`}</span>
                    <span className="text-[11px] text-slate-400">{v.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Live Preview & Controls (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-white">{currentTemplateDef.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">Subject: {livePreview.subject}</p>
                </div>

                {/* Device Mode Switch */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      previewDevice === 'desktop' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      previewDevice === 'mobile' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile</span>
                  </button>
                </div>
              </div>

              {/* Rendered HTML Container */}
              <div
                className={`mx-auto transition-all duration-300 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl ${
                  previewDevice === 'mobile' ? 'max-w-sm' : 'w-full'
                }`}
              >
                <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate">To: rahul@example.com</span>
                  <span className="text-emerald-400 font-bold">Live HTML Preview</span>
                </div>
                <div
                  className="bg-[#090614] p-2 sm:p-4 max-h-[550px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: livePreview.html }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Send Test Email */}
      {activeSubTab === 'test' && (
        <div className="max-w-2xl mx-auto rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-7 space-y-6 shadow-2xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-black text-white">Send Real-Time Test Email</h2>
            </div>
            <p className="text-xs text-slate-400">
              Trigger any of the 10 transactional email templates to your real inbox to test delivery and rendering.
            </p>
          </div>

          {testResult && (
            <div
              className={`p-4 rounded-xl text-xs space-y-1 font-bold ${
                testResult.success
                  ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300'
                  : 'bg-red-950/80 border border-red-500 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 text-sm">
                {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{testResult.success ? 'Test Email Dispatched Successfully!' : 'Test Email Failed'}</span>
              </div>
              {testResult.messageId && (
                <div className="font-mono text-[11px] opacity-90">Message ID: {testResult.messageId}</div>
              )}
              {testResult.error && <div>Error Details: {testResult.error}</div>}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Select Template Event</label>
              <select
                value={testTemplateId}
                onChange={(e) => setTestTemplateId(e.target.value as EmailEventType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                {EMAIL_TEMPLATE_DEFINITIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Recipient Email Address</label>
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              />
              <p className="text-[11px] text-slate-400">
                You can send test emails to your personal inbox (e.g. Gmail / Outlook / Yahoo).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider">
                What will be sent:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                A fully responsive HTML email branded with Apna Tambola logo, styled data cards, dynamic dummy values, and gold action buttons.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSendTest}
              disabled={isSendingTest}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{isSendingTest ? 'Sending via Brevo...' : 'Send Live Test Email Now'}</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: Transactional Email Logs */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Transactional Email Audit Logs</span>
                  <Clock className="w-5 h-5 text-amber-400" />
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time log of every transactional email dispatched by the system.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Filter Pills */}
                {(['all', 'sent', 'failed', 'simulated'] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    onClick={() => setLogFilter(filterKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      logFilter === filterKey
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {filterKey}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold border border-red-500/30 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Logs</span>
                </button>
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <th className="p-3">Status</th>
                    <th className="p-3">Event Type</th>
                    <th className="p-3">Recipient</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Sent At</th>
                    <th className="p-3">Delivery Method</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        No email logs matching the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              log.status === 'sent' || log.status === 'delivered'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : log.status === 'failed'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-white">
                          <span className="bg-slate-950 px-2 py-0.5 rounded text-[11px] font-mono text-amber-400">
                            {log.eventType}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">
                          <div className="font-bold">{log.recipientName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{log.recipientEmail}</div>
                        </td>
                        <td className="p-3 text-slate-300 max-w-xs truncate">{log.subject}</td>
                        <td className="p-3 text-slate-400 whitespace-nowrap">
                          {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                          {new Date(log.sentAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-[10px]">
                          {log.deliveryMethod === 'brevo_api' ? '⚡ Brevo REST API' : '🟡 Sandbox Sim'}
                        </td>
                        <td className="p-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedLogPreview(log)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold cursor-pointer"
                          >
                            View HTML
                          </button>
                          {log.status === 'failed' && (
                            <button
                              type="button"
                              onClick={() => handleRetryEmail(log.id)}
                              disabled={isRetryingId === log.id}
                              className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                            >
                              {isRetryingId === log.id ? 'Retrying...' : 'Retry'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* HTML Email Modal Viewer */}
      {selectedLogPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Inspecting Sent Email</span>
                  <span className="text-xs text-amber-400 font-mono">[{selectedLogPreview.eventType}]</span>
                </h3>
                <div className="text-xs text-slate-400">
                  Recipient: <strong className="text-white">{selectedLogPreview.recipientEmail}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogPreview(null)}
                className="px-3 py-1 rounded-lg bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="p-4 bg-[#090614] overflow-y-auto flex-1">
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    selectedLogPreview.htmlPreview ||
                    generateEmailHtml(selectedLogPreview.eventType, selectedLogPreview.payloadData || {}).html,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
