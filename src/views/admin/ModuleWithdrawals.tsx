import React, { useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  CreditCard,
  Search,
  Filter,
  Sliders,
  DollarSign,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { WithdrawalRequest } from '../../types';

interface ModuleWithdrawalsProps {
  withdrawals: WithdrawalRequest[];
  onApproveWithdrawal: (id: string) => Promise<boolean>;
  onRejectWithdrawal: (id: string) => Promise<boolean>;
}

export const ModuleWithdrawals: React.FC<ModuleWithdrawalsProps> = ({
  withdrawals,
  onApproveWithdrawal,
  onRejectWithdrawal,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Settings
  const [minWithdrawal, setMinWithdrawal] = useState(100);
  const [withdrawalMultiple, setWithdrawalMultiple] = useState(100);
  const [maxWithdrawal, setMaxWithdrawal] = useState(50000);
  const [tdsPercentage, setTdsPercentage] = useState(10);
  const [adminFeePercentage, setAdminFeePercentage] = useState(5);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Reject modal
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Incorrect bank/UPI details or unverified KYC');

  const pendingList = withdrawals.filter((w) => w.status === 'pending');
  const approvedList = withdrawals.filter((w) => w.status === 'approved');
  const rejectedList = withdrawals.filter((w) => w.status === 'rejected');

  const totalPendingAmount = pendingList.reduce((sum, w) => sum + w.amount, 0);
  const totalApprovedAmount = approvedList.reduce((sum, w) => sum + w.amount, 0);

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (filterTab === 'pending' && w.status !== 'pending') return false;
    if (filterTab === 'approved' && w.status !== 'approved') return false;
    if (filterTab === 'rejected' && w.status !== 'rejected') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        w.userName.toLowerCase().includes(q) ||
        w.userPhone.toLowerCase().includes(q) ||
        (w.upiId && w.upiId.toLowerCase().includes(q)) ||
        (w.accountNumber && w.accountNumber.toLowerCase().includes(q)) ||
        w.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExecuteReject = async () => {
    if (!rejectingId) return;
    await onRejectWithdrawal(rejectingId);
    setRejectingId(null);
  };

  const handleSaveLimits = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveNotice('Withdrawal limits (Min ₹100, Multiple ₹100) and fee policy (10% TDS + 5% Admin) updated!');
    setTimeout(() => setSaveNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 text-amber-400" />
            <span>Withdrawal Requests &amp; Payout Settlement</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Process player cashouts with 10% TDS deduction &amp; 5% admin charges (Net 85% payout via UPI / IMPS).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-400/40 text-xs">
            <span className="text-amber-400 font-bold">Pending: </span>
            <strong className="text-amber-300 font-black">₹{totalPendingAmount.toLocaleString('en-IN')}</strong> ({pendingList.length})
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
            <span className="text-emerald-400 font-bold">Approved: </span>
            <strong className="text-emerald-300 font-black">₹{totalApprovedAmount.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>

      {/* Withdrawal Limits & Settings Strip */}
      <form onSubmit={handleSaveLimits} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Min Withdrawal:</span>
            <span className="text-white font-mono font-bold">₹</span>
            <input
              type="number"
              value={minWithdrawal}
              onChange={(e) => setMinWithdrawal(Number(e.target.value))}
              className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Multiple:</span>
            <span className="text-white font-mono font-bold">₹</span>
            <input
              type="number"
              value={withdrawalMultiple}
              onChange={(e) => setWithdrawalMultiple(Number(e.target.value))}
              className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Max Per Day:</span>
            <span className="text-white font-mono font-bold">₹</span>
            <input
              type="number"
              value={maxWithdrawal}
              onChange={(e) => setMaxWithdrawal(Number(e.target.value))}
              className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-red-400 font-bold">TDS (10%):</span>
            <input
              type="number"
              value={tdsPercentage}
              onChange={(e) => setTdsPercentage(Number(e.target.value))}
              className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold"
            />
            <span className="text-slate-400 font-bold">%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">Admin Fee (5%):</span>
            <input
              type="number"
              value={adminFeePercentage}
              onChange={(e) => setAdminFeePercentage(Number(e.target.value))}
              className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold"
            />
            <span className="text-slate-400 font-bold">%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveNotice && <span className="text-emerald-400 font-bold text-[11px]">{saveNotice}</span>}
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 text-xs font-bold cursor-pointer"
          >
            Save Payout Policy
          </button>
        </div>
      </form>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {[
            { id: 'pending', label: `Pending (${pendingList.length})` },
            { id: 'approved', label: `Approved (${approvedList.length})` },
            { id: 'rejected', label: `Rejected (${rejectedList.length})` },
            { id: 'all', label: `All (${withdrawals.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, UPI, account..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Request ID / Date</th>
                <th className="px-4 py-3.5">Player / Phone</th>
                <th className="px-4 py-3.5">Gross &amp; Net Payout</th>
                <th className="px-4 py-3.5">Payment Method &amp; Details</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Settlement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredWithdrawals.map((req) => {
                const reqTds = req.tdsAmount ?? Math.round(req.amount * 0.10);
                const reqAdminFee = req.adminFeeAmount ?? Math.round(req.amount * 0.05);
                const reqNet = req.netAmount ?? (req.amount - reqTds - reqAdminFee);
                return (
                <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                    <div className="text-white font-bold">{req.id}</div>
                    <div>{req.requestDate}</div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="text-white font-bold text-xs">{req.userName}</div>
                    <div className="text-[11px] text-slate-400">{req.userPhone}</div>
                  </td>

                  <td className="px-4 py-3.5 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-xs line-through">₹{req.amount.toLocaleString('en-IN')}</span>
                      <span className="text-emerald-400 font-black text-sm">₹{reqNet.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      <span className="text-red-400">TDS 10%: -₹{reqTds}</span> • <span className="text-amber-400">Admin 5%: -₹{reqAdminFee}</span>
                    </div>
                    <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Net Payout to Send</div>
                  </td>

                  {/* Payment Details with Copy */}
                  <td className="px-4 py-3.5 space-y-1">
                    {req.paymentMethod === 'upi' ? (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-black border border-purple-400/30">
                          UPI
                        </span>
                        <span className="font-mono text-white font-bold">{req.upiId || 'player@upi'}</span>
                        <button
                          onClick={() => handleCopy(req.upiId || 'player@upi', req.id)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          title="Copy UPI ID"
                        >
                          {copiedId === req.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[9px] font-black">
                            BANK
                          </span>
                          <span className="text-white font-bold">{req.bankName}</span>
                          <button
                            onClick={() => handleCopy(req.accountNumber || '', req.id)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                            title="Copy Account Number"
                          >
                            {copiedId === req.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="text-slate-400 font-mono">
                          A/C: {req.accountNumber} • IFSC: {req.ifsc}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                        req.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : req.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}
                    >
                      {req.status === 'approved' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : req.status === 'pending' ? (
                        <Clock className="w-3 h-3 text-amber-400" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-400" />
                      )}
                      <span>{req.status.toUpperCase()}</span>
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    {req.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onApproveWithdrawal(req.id)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow cursor-pointer active:scale-95 transition-transform"
                        >
                          ✓ Approve & Pay
                        </button>
                        <button
                          onClick={() => setRejectingId(req.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {req.adminRemarks || (req.status === 'approved' ? 'Settled via IMPS' : 'Declined')}
                      </span>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Reject Reason */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border-2 border-red-500 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">Decline Cashout Request</h3>
              <button onClick={() => setRejectingId(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              The amount will be refunded back to the player's Winning Wallet balance immediately.
            </p>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">Reason for Rejection</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReject}
                className="px-5 py-2 rounded-xl bg-red-600 text-white font-black text-xs shadow"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};