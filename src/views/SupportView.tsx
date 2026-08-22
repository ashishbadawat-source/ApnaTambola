import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Send,
  PlusCircle,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Sparkles,
  Copy,
  Check,
  Headphones,
  ExternalLink,
} from 'lucide-react';
import { SupportTicket, User } from '../types';
import { openTawkChat, syncUserToTawk } from '../utils/tawk';
import { openBrevoChat, syncUserToBrevoConversations } from '../utils/brevoConversations';

interface SupportViewProps {
  currentUser: User;
  tickets: SupportTicket[];
  onCreateTicket: (subject: string, category: string, message: string) => Promise<boolean>;
  onSendReply: (ticketId: string, text: string) => Promise<boolean>;
}

export const SupportView: React.FC<SupportViewProps> = ({
  currentUser,
  tickets,
  onCreateTicket,
  onSendReply,
}) => {
  const [activeTicketId, setActiveTicketId] = useState<string>(tickets[0]?.id || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Gameplay');
  const [message, setMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const TICKET_EMAIL = 'tickets@click-earn-hvfde7.p.tawk.email';

  useEffect(() => {
    if (currentUser) {
      syncUserToTawk(currentUser);
      syncUserToBrevoConversations(currentUser);
    }
  }, [currentUser]);

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(TICKET_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const activeTicket = tickets.find((t) => t.id === activeTicketId) || tickets[0];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    const success = await onCreateTicket(subject, category, message);
    if (success) {
      setShowCreateModal(false);
      setSubject('');
      setMessage('');
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;
    await onSendReply(activeTicket.id, replyText);
    setReplyText('');
  };

  const faqs = [
    {
      q: 'How does the 5-Level Referral System work?',
      a: 'Whenever any player registers using your referral code, they become your Level 1 referral (4% commission). When they invite friends, those become your Level 2 (2%), Level 3 (1%), Level 4 (0.5%), and Level 5 (0.3%). You earn commissions every time they buy tickets!',
    },
    {
      q: 'How are Tambola prizes verified?',
      a: 'Our server uses provably fair RNG ball draws. When you click Claim Prize on your ticket, our backend validates every marked number against the official called numbers history in milliseconds.',
    },
    {
      q: 'How fast are UPI and Bank IMPS withdrawals?',
      a: 'Withdrawals are processed instantly or within 5 to 15 minutes after automated security checks. Minimum withdrawal is ₹100.',
    },
    {
      q: 'Can I print or download my tickets?',
      a: 'Yes! Click on the Print / QR Code button on any ticket card. You can print physical sheets with custom QR codes or save them as PDF.',
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100">
              Help Center &amp; Support
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            24/7 Customer assistance for gameplay, wallet, and referral queries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Brevo Conversations Quick Trigger */}
          <button
            onClick={openBrevoChat}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>💬 Live Chat (Brevo)</span>
          </button>

          {/* Tawk.to Live Chat Quick Trigger */}
          <button
            onClick={openTawkChat}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>💬 Live Chat (Tawk.to)</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      {/* 24/7 Live Support Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Brevo Conversations Card */}
        <div className="glass-panel rounded-3xl p-5 border-2 border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">Brevo 24x7 Live Desk</h3>
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    ONLINE
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Instant live agent chat powered by Brevo Conversations.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openBrevoChat}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>ब्रेवो लाइव चैट (Start Brevo Live Chat)</span>
          </button>
        </div>

        {/* Tawk.to Live Chat Card */}
        <div className="glass-panel rounded-3xl p-5 border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">Tawk.to 24x7 Live Desk</h3>
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    ONLINE
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct real-time conversation with support agents.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openTawkChat}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>टॉक लाइव चैट (Start Tawk Live Chat)</span>
          </button>
        </div>

        {/* Official Ticket Email Card */}
        <div className="glass-panel rounded-3xl p-5 border-2 border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Official Ticket Email Desk</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Send email queries directly to our Tawk ticketing inbox.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-amber-300 truncate font-semibold">
              {TICKET_EMAIL}
            </span>
            <button
              onClick={handleCopyEmail}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0"
              title="Copy Email"
            >
              {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* FAQs Section */}
      <section className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-slate-100">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-950/60 border border-slate-800/80 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-200 hover:text-amber-300 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-slate-400 leading-relaxed border-t border-slate-900">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Support Tickets & Messages Live Thread */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Ticket List */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
          <h3 className="font-bold text-sm text-slate-100">My Support Tickets</h3>
          <div className="space-y-2">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveTicketId(t.id)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                  activeTicket?.id === t.id
                    ? 'bg-purple-950/40 border-amber-400 ring-1 ring-amber-400/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-amber-300 font-bold">{t.ticketCode}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    t.status === 'open' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-200 truncate">{t.subject}</h4>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{t.category}</span>
                  <span>{t.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Ticket Thread */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          {activeTicket ? (
            <>
              <div className="space-y-3 border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-100">{activeTicket.subject}</h3>
                    <span className="text-xs text-slate-400">Category: {activeTicket.category}</span>
                  </div>
                  <span className="font-mono text-xs text-amber-400 font-bold">{activeTicket.ticketCode}</span>
                </div>
              </div>

              {/* Chat messages */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {activeTicket.messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-2xl max-w-[85%] space-y-1 text-xs ${
                        isUser
                          ? 'ml-auto bg-purple-900/60 text-slate-100 border border-purple-500/30'
                          : 'mr-auto bg-slate-900 text-slate-200 border border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 font-bold">
                        <span>{msg.senderName}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p>{msg.message}</p>
                    </div>
                  );
                })}
              </div>

              {/* Reply box */}
              <form onSubmit={handleReplySubmit} className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="Type your response..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              No tickets selected. Create a ticket to reach our team.
            </div>
          )}
        </div>
      </section>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 space-y-4 border border-purple-500/40">
            <h3 className="font-bold text-lg text-slate-100">Create Support Ticket</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Gameplay">Tambola Gameplay &amp; Number Calls</option>
                  <option value="Wallet">Wallet Deposit &amp; Withdrawal</option>
                  <option value="Referral">5-Level Referral Commission</option>
                  <option value="Tickets">Ticket Verification &amp; Printing</option>
                  <option value="Other">Other Issues</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Subject</label>
                <input
                  type="text"
                  placeholder="Short description of the issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Detailed Message</label>
                <textarea
                  rows={4}
                  placeholder="Provide all details, transaction IDs or ticket numbers..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
