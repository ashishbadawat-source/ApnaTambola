import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Download, Share2, ShieldCheck, Check, Palette } from 'lucide-react';
import { TambolaTicket } from '../types';
import { getTicketTheme } from '../utils/ticketColors';

interface PrintTicketModalProps {
  ticket: TambolaTicket | null;
  onClose: () => void;
}

export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({ ticket, onClose }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const theme = ticket ? getTicketTheme(ticket.colorTheme, ticket.ticketNumber) : null;

  useEffect(() => {
    if (ticket) {
      const qrPayload = JSON.stringify({
        id: ticket.ticketId,
        game: ticket.gameTitle,
        user: ticket.userName,
        number: ticket.ticketNumber,
        verify: 'VERIFIED_GENUINE_TAMBOLA_LIVE',
      });
      QRCode.toDataURL(qrPayload, { width: 140, margin: 1 })
        .then((url) => setQrCodeDataUrl(url))
        .catch(() => {});
    }
  }, [ticket]);

  if (!ticket || !theme) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/?verifyTicket=${ticket.ticketId}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl glass-panel rounded-2xl border border-amber-500/30 p-4 sm:p-6 shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Print &amp; Share Tambola Ticket
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-500/30 font-semibold">
              {theme.badgeLabel} Edition
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Certificate Wrapper */}
        <div
          id="printable-ticket-content"
          className={`print-ticket-container rounded-xl p-4 sm:p-6 border-2 ${theme.printBorder} bg-gradient-to-br ${theme.printBg} text-white shadow-2xl relative overflow-hidden`}
        >
          {/* Watermark */}
          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 text-7xl font-black rotate-[-15deg] select-none ${theme.printWatermark}`}>
            TAMBOLA LIVE
          </div>

          {/* Ticket Header */}
          <div className={`flex items-center justify-between border-b-2 ${theme.printBorder} pb-3 mb-4`}>
            <div>
              <div className="flex items-center gap-2">
                <span className={`${theme.topBarGradient} ${theme.topBarText} text-xs font-black px-2 py-0.5 rounded`}>
                  TAMBOLA LIVE
                </span>
                <span className="font-mono text-xs text-amber-300 font-bold">
                  {ticket.ticketId}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-100 mt-1">
                {ticket.gameTitle}
              </h3>
              <p className="text-xs text-slate-300">
                Player: <strong className="text-white">{ticket.userName}</strong> | Ticket #{ticket.ticketNumber} ({theme.name})
              </p>
            </div>

            {/* QR Code */}
            {qrCodeDataUrl && (
              <div className="bg-white p-1 rounded-lg shadow-md">
                <img
                  src={qrCodeDataUrl}
                  alt="Ticket QR Code"
                  className="w-16 h-16 sm:w-20 sm:h-20"
                />
              </div>
            )}
          </div>

          {/* 3x9 Standard Tambola Grid */}
          <div className="bg-slate-950/90 rounded-lg p-2 border border-slate-700 shadow-inner mb-3">
            <div className="grid grid-rows-3 gap-1.5">
              {ticket.numbers.map((row, rIdx) => (
                <div key={rIdx} className="grid grid-cols-9 gap-1.5">
                  {row.map((num, cIdx) => (
                    <div
                      key={cIdx}
                      className={`print-ticket-cell h-9 sm:h-12 rounded flex items-center justify-center font-black text-sm sm:text-lg ${
                        num > 0
                          ? `bg-slate-900 ${theme.printCellText} border border-slate-700 shadow-sm`
                          : 'bg-slate-950/50 border border-slate-800/40 text-slate-800'
                      }`}
                    >
                      {num > 0 ? num : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Security & Verification Footer */}
          <div className="flex items-center justify-between text-[11px] text-slate-300 border-t border-slate-800 pt-2 font-mono">
            <span>PRICE: ₹{ticket.price} PAID</span>
            <span>THEME: {theme.badgeLabel.toUpperCase()}</span>
            <span>AUTH CODE: {ticket.ticketId.replace('TKT-', 'SEC-')}</span>
            <span>RNG VERIFIED</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 no-print">
          <button
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Link Copied!' : 'Copy Ticket Link'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/30 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
};
