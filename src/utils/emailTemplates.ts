import { EmailEventType, EmailTemplateDefinition } from '../types';

export const EMAIL_TEMPLATE_DEFINITIONS: EmailTemplateDefinition[] = [
  {
    id: 'user_registration',
    name: '1. Welcome & Registration Email',
    category: 'Account & Security',
    description: 'Sent instantly when a user signs up. Highlights their ₹50 joining bonus and referral code.',
    defaultSubject: '🎉 Welcome to Apna Tambola! Your ₹50 Bonus is Active 🪙',
    supportedVariables: [
      { key: 'userName', label: 'User Name', example: 'Rahul Sharma' },
      { key: 'userEmail', label: 'User Email', example: 'rahul@example.com' },
      { key: 'phone', label: 'Phone Number', example: '+91 98765 43210' },
      { key: 'referralCode', label: 'Referral Code', example: 'TAMBOLA99' },
      { key: 'bonusAmount', label: 'Joining Bonus', example: '50' },
      { key: 'loginUrl', label: 'Login URL', example: 'https://apnatambola.com' },
    ],
  },
  {
    id: 'email_verification',
    name: '2. Email OTP Verification',
    category: 'Account & Security',
    description: 'Sent when user requests verification or 2-factor email confirmation with 6-digit OTP code.',
    defaultSubject: '🔐 Your Apna Tambola Verification Code: {{otpCode}}',
    supportedVariables: [
      { key: 'userName', label: 'User Name', example: 'Rahul Sharma' },
      { key: 'otpCode', label: '6-Digit OTP', example: '582914' },
      { key: 'expiresInMinutes', label: 'Expiry Duration', example: '10' },
    ],
  },
  {
    id: 'password_reset',
    name: '3. Password Reset Request',
    category: 'Account & Security',
    description: 'Sent when user initiates password recovery. Contains secure OTP and reset instructions.',
    defaultSubject: '🔑 Reset Your Apna Tambola Password [Code: {{resetOtp}}]',
    supportedVariables: [
      { key: 'userName', label: 'User Name', example: 'Rahul Sharma' },
      { key: 'resetOtp', label: 'Reset OTP Code', example: '739104' },
      { key: 'requestTime', label: 'Request Timestamp', example: '22 Aug, 05:30 PM' },
      { key: 'expiresInMinutes', label: 'Expiry Minutes', example: '15' },
    ],
  },
  {
    id: 'ticket_purchase',
    name: '4. Ticket Purchase Confirmation',
    category: 'Gameplay & Tickets',
    description: 'Sent right after booking tickets with full game details, ticket IDs, price, and match schedule.',
    defaultSubject: '🎟️ Ticket Confirmed! {{gameTitle}} [Ticket: {{ticketId}}]',
    supportedVariables: [
      { key: 'userName', label: 'User Name', example: 'Rahul Sharma' },
      { key: 'gameTitle', label: 'Game Title', example: '₹50 Mega Bumper Jackpot' },
      { key: 'gameCode', label: 'Game Code', example: 'TB-774' },
      { key: 'gameTime', label: 'Match Start Time', example: 'Today at 09:00 PM' },
      { key: 'ticketCount', label: 'Tickets Count', example: '2' },
      { key: 'ticketId', label: 'Ticket ID', example: 'TKT-9824-712' },
      { key: 'totalPaid', label: 'Total Amount Paid', example: '100' },
      { key: 'prizePool', label: 'Tournament Prize Pool', example: '10,920' },
    ],
  },
  {
    id: 'game_start',
    name: '5. Game Live / Start Alert',
    category: 'Gameplay & Tickets',
    description: 'Sent 5-10 minutes before game goes live so players do not miss the first auto-called number.',
    defaultSubject: '🔴 GAME IS LIVE NOW! Join {{gameTitle}} and Claim Prizes 🏆',
    supportedVariables: [
      { key: 'userName', label: 'User Name', example: 'Rahul Sharma' },
      { key: 'gameTitle', label: 'Game Title', example: '₹100 Grand Weekend Maha Housie' },
      { key: 'gameCode', label: 'Game Code', example: 'TB-101' },
      { key: 'prizePool', label: 'Jackpot Prize', example: '54,600' },
      { key: 'roomUrl', label: 'Game Room URL', example: 'https://apnatambola.com' },
    ],
  },
  {
    id: 'winning',
    name: '6. Winner / BINGO Victory Notification',
    category: 'Gameplay & Tickets',
    description: 'Celebratory notification sent when user wins Early 5, Lines, or Full House with instant credit receipt.',
    defaultSubject: '🏆 BINGO! You Won ₹{{winningAmount}} in {{gameTitle}}! 🎊',
    supportedVariables: [
      { key: 'userName', label: 'User Name', example: 'Rahul Sharma' },
      { key: 'prizeName', label: 'Prize Won', example: 'Full House (1st)' },
      { key: 'winningAmount', label: 'Winning Amount (₹)', example: '3,500' },
      { key: 'gameTitle', label: 'Tournament Name', example: '₹50 Mega Bumper Jackpot' },
      { key: 'ticketId', label: 'Winning Ticket ID', example: 'TKT-9824-712' },
      { key: 'winningNumber', label: 'Winning Called Number', example: '76' },
      { key: 'walletBalance', label: 'Updated Winning Wallet', example: '4,280' },
    ],
  },
  {
    id: 'withdrawal_request',
    name: '7. Withdrawal Request Confirmation',
    category: 'Finance & Wallet',
    description: 'Sent when a player requests cashout to UPI or Bank account with reference details.',
    defaultSubject: '💸 Withdrawal Request Received: ₹{{amount}} [Ref: {{referenceId}}]',
    supportedVariables: [
      { key: 'userName', label: 'User Name', example: 'Rahul Sharma' },
      { key: 'amount', label: 'Withdrawal Amount', example: '1,500' },
      { key: 'paymentMethod', label: 'Payment Method', example: 'Instant UPI' },
      { key: 'upiIdOrBank', label: 'Payout Account', example: 'rahul@okaxis' },
      { key: 'referenceId', label: 'Reference ID', example: 'WDR-9812-441' },
      { key: 'requestDate', label: 'Request Date', example: '22 Aug 2026, 05:40 PM' },
    ],
  },
  {
    id: 'withdrawal_status',
    name: '8. Withdrawal Approval / Status Email',
    category: 'Finance & Wallet',
    description: 'Sent when admin approves payout (with UTR) or rejects with refund justification.',
    defaultSubject: '✅ Withdrawal {{status}}: ₹{{amount}} Credited to Your Account',
    supportedVariables: [
      { key: 'userName', label: 'User Name', example: 'Rahul Sharma' },
      { key: 'amount', label: 'Amount', example: '1,500' },
      { key: 'status', label: 'Status (Approved/Rejected)', example: 'Approved' },
      { key: 'utrNumber', label: 'Bank UTR / IMPS Ref', example: 'UTR88392019482' },
      { key: 'remarks', label: 'Admin Remarks', example: 'Processed via automated IMPS' },
      { key: 'referenceId', label: 'Reference ID', example: 'WDR-9812-441' },
      { key: 'processedDate', label: 'Processed Date', example: '22 Aug 2026, 05:45 PM' },
    ],
  },
  {
    id: 'wallet_transaction',
    name: '9. Wallet Transaction & Deposit Receipt',
    category: 'Finance & Wallet',
    description: 'Sent whenever money is credited or transferred (Recharge, P2P Transfer, Bonus unlock).',
    defaultSubject: '💳 Wallet Transaction Confirmed: ₹{{amount}} [{{txnType}}]',
    supportedVariables: [
      { key: 'userName', label: 'User Name', example: 'Rahul Sharma' },
      { key: 'txnType', label: 'Transaction Type', example: 'Wallet Deposit' },
      { key: 'amount', label: 'Transaction Amount', example: '500' },
      { key: 'referenceId', label: 'Transaction ID', example: 'PAY-8823-192' },
      { key: 'paymentMethod', label: 'Payment Gateway/UPI', example: 'UPI QR Pay' },
      { key: 'balanceAfter', label: 'New Wallet Balance', example: '1,250' },
      { key: 'date', label: 'Date & Time', example: '22 Aug 2026, 05:42 PM' },
    ],
  },
  {
    id: 'referral_commission',
    name: '10. 5-Level Referral Commission Alert',
    category: 'Affiliate',
    description: 'Sent whenever a downline team member buys tickets and earns upline passive commission.',
    defaultSubject: '🤝 Level {{level}} Commission Earned! ₹{{commissionAmount}} Added to Wallet 💰',
    supportedVariables: [
      { key: 'userName', label: 'User Name', example: 'Rahul Sharma' },
      { key: 'commissionAmount', label: 'Commission Amount', example: '25.00' },
      { key: 'level', label: 'Affiliate Level (1-5)', example: '1' },
      { key: 'percentage', label: 'Commission Rate', example: '4.0%' },
      { key: 'sourceUserName', label: 'Downline Member Name', example: 'Amit Patel' },
      { key: 'gameTitle', label: 'Game Played', example: '₹100 Grand Maha Housie' },
      { key: 'newReferralBalance', label: 'Total Referral Earnings', example: '1,840.50' },
      { key: 'date', label: 'Timestamp', example: '22 Aug 2026, 05:48 PM' },
    ],
  },
];

export function generateEmailHtml(
  eventType: EmailEventType,
  data: Record<string, any>,
  customSettings?: { senderName?: string; footerText?: string; supportPhone?: string }
): { subject: string; html: string } {
  const brandName = customSettings?.senderName || 'Apna Tambola - अपना तंबोला';
  const footerText = customSettings?.footerText || 'India’s #1 Real-Time Multiplayer Housie Tournament Portal. Play Responsibly. 18+ Only.';
  const supportPhone = customSettings?.supportPhone || '+91 98765 43210';
  const currentYear = new Date().getFullYear();

  let subject = '';
  let contentHtml = '';

  switch (eventType) {
    case 'user_registration': {
      const name = data.userName || 'Tambola Champ';
      const bonus = data.bonusAmount || '50';
      const refCode = data.referralCode || 'TAMBOLA100';
      subject = `🎉 Welcome to Apna Tambola! Your ₹${bonus} Bonus is Active 🪙`;
      contentHtml = `
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #eab308); color: #0f172a; padding: 6px 16px; border-radius: 999px; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
            ₹${bonus} WELCOME BONUS CREDITED
          </div>
          <h2 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 16px 0 8px 0;">Namaste, ${name}! 🙏</h2>
          <p style="color: #cbd5e1; font-size: 15px; margin: 0; line-height: 1.6;">
            Welcome to the official family of <strong>Apna Tambola</strong> — where thrilling live Housie tournaments, real-time number calling, and instant UPI payouts come together!
          </p>
        </div>

        <div style="background: rgba(245, 158, 11, 0.1); border: 2px solid #f59e0b; border-radius: 16px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="color: #fcd34d; font-size: 13px; font-weight: 700; margin: 0 0 6px 0; text-transform: uppercase;">Your Unique Referral Code</p>
          <div style="background: #0f172a; border: 1px dashed #f59e0b; color: #fbbf24; font-size: 26px; font-weight: 900; letter-spacing: 4px; padding: 12px; border-radius: 12px; display: inline-block; min-width: 200px;">
            ${refCode}
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0;">Share with friends and earn up to <strong>5-Level passive commissions</strong> on every ticket they book!</p>
        </div>

        <div style="background: #1e1b4b; border-radius: 14px; padding: 18px; margin-bottom: 24px;">
          <h3 style="color: #e0e7ff; font-size: 15px; font-weight: 800; margin: 0 0 12px 0;">✨ What You Can Do Now:</h3>
          <ul style="color: #cbd5e1; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Book tickets for upcoming live tournaments starting from just ₹5</li>
            <li>Experience authentic colorful tickets with auto-dab and claim assistance</li>
            <li>Spin the Daily Wheel & Scratch cards for extra cash rewards</li>
            <li>Instant 24x7 withdrawals via UPI & Direct Bank IMPS</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 28px;">
          <a href="https://apnatambola.com" style="background: linear-gradient(135deg, #eab308, #f59e0b); color: #020617; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 900; font-size: 15px; display: inline-block; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
            🚀 PLAY FIRST TAMBOLA MATCH NOW
          </a>
        </div>
      `;
      break;
    }

    case 'email_verification': {
      const name = data.userName || 'Valued Player';
      const otp = data.otpCode || '582914';
      const expiry = data.expiresInMinutes || '10';
      subject = `🔐 Your Apna Tambola Verification Code: ${otp}`;
      contentHtml = `
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 0 0 8px 0;">Verify Your Email Address</h2>
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">Hi ${name}, please use the One-Time Password (OTP) below to verify your email.</p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <div style="background: #0f172a; border: 2px solid #38bdf8; border-radius: 16px; padding: 24px; display: inline-block;">
            <div style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">SECURITY OTP CODE</div>
            <div style="color: #38bdf8; font-size: 38px; font-weight: 900; letter-spacing: 8px; font-family: monospace;">
              ${otp}
            </div>
            <div style="color: #f87171; font-size: 12px; margin-top: 8px; font-weight: 600;">⏱️ Valid for ${expiry} minutes only</div>
          </div>
        </div>

        <p style="color: #64748b; font-size: 12px; text-align: center; line-height: 1.5;">
          If you did not request this verification code, please ignore this email or contact our support team immediately. Never share your OTP with anyone.
        </p>
      `;
      break;
    }

    case 'password_reset': {
      const name = data.userName || 'Player';
      const otp = data.resetOtp || '739104';
      const expiry = data.expiresInMinutes || '15';
      const time = data.requestTime || new Date().toLocaleString();
      subject = `🔑 Reset Your Apna Tambola Password [Code: ${otp}]`;
      contentHtml = `
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid #ef4444; padding: 4px 14px; border-radius: 999px; font-weight: 800; font-size: 11px; text-transform: uppercase;">
            SECURITY ACTION REQUIRED
          </div>
          <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 14px 0 6px 0;">Password Reset Request</h2>
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">Hi ${name}, we received a request to reset your password on ${time}.</p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <div style="background: #0f172a; border: 2px solid #ef4444; border-radius: 16px; padding: 22px; display: inline-block;">
            <div style="color: #cbd5e1; font-size: 12px; font-weight: 700; margin-bottom: 6px;">YOUR PASSWORD RESET PIN</div>
            <div style="color: #ef4444; font-size: 36px; font-weight: 900; letter-spacing: 6px; font-family: monospace;">
              ${otp}
            </div>
            <div style="color: #fca5a5; font-size: 12px; margin-top: 6px;">Expires in ${expiry} minutes</div>
          </div>
        </div>

        <div style="background: #1e1b4b; border-radius: 12px; padding: 14px; color: #cbd5e1; font-size: 13px; line-height: 1.5;">
          🛡️ <strong>Security Tip:</strong> Choose a strong password with at least 8 characters including numbers and special symbols. If you did not make this request, your account may be under threat — please contact support at ${supportPhone}.
        </div>
      `;
      break;
    }

    case 'ticket_purchase': {
      const name = data.userName || 'Player';
      const gameTitle = data.gameTitle || 'Mega Bumper Jackpot';
      const ticketId = data.ticketId || 'TKT-9824-712';
      const count = data.ticketCount || '1';
      const totalPaid = data.totalPaid || '50';
      const gameTime = data.gameTime || 'Today at 09:00 PM';
      const pool = data.prizePool || '10,920';

      subject = `🎟️ Ticket Confirmed! ${gameTitle} [Ticket: ${ticketId}]`;
      contentHtml = `
        <div style="text-align: center; margin-bottom: 22px;">
          <div style="display: inline-block; background: #10b981; color: #022c22; padding: 4px 14px; border-radius: 999px; font-weight: 900; font-size: 11px; text-transform: uppercase;">
            ✓ BOOKING SUCCESSFUL
          </div>
          <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 12px 0 4px 0;">You're In The Game! 🎯</h2>
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">Hi ${name}, your tickets have been reserved and locked.</p>
        </div>

        <!-- Ticket Summary Card -->
        <div style="background: linear-gradient(135deg, #1e1b4b, #2e1065); border: 2px solid #a855f7; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
          <div style="border-bottom: 1px dashed rgba(168, 85, 247, 0.4); padding-bottom: 14px; margin-bottom: 14px; display: flex; justify-content: space-between;">
            <div>
              <div style="color: #c084fc; font-size: 11px; font-weight: 800; text-transform: uppercase;">TOURNAMENT</div>
              <div style="color: #ffffff; font-size: 17px; font-weight: 900;">${gameTitle}</div>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Primary Ticket ID:</td>
              <td style="color: #fbbf24; font-weight: 900; text-align: right; font-family: monospace;">${ticketId}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Total Tickets:</td>
              <td style="color: #ffffff; font-weight: 800; text-align: right;">${count} Ticket(s)</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Match Start Time:</td>
              <td style="color: #38bdf8; font-weight: 800; text-align: right;">${gameTime}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Prize Pool:</td>
              <td style="color: #4ade80; font-weight: 900; text-align: right;">₹${pool}</td>
            </tr>
            <tr style="border-top: 1px solid rgba(255,255,255,0.1);">
              <td style="color: #cbd5e1; font-weight: 700; padding: 10px 0 0 0;">Total Amount Paid:</td>
              <td style="color: #f59e0b; font-size: 18px; font-weight: 900; text-align: right; padding: 10px 0 0 0;">₹${totalPaid}</td>
            </tr>
          </table>
        </div>

        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 12px; padding: 14px; text-align: center; margin-bottom: 24px;">
          <p style="color: #6ee7b7; font-size: 13px; font-weight: 700; margin: 0;">
            ⚡ Auto-Play Enabled: Even if you go offline or get disconnected, our server will track your ticket numbers and auto-claim prizes for you!
          </p>
        </div>

        <div style="text-align: center;">
          <a href="https://apnatambola.com" style="background: linear-gradient(135deg, #a855f7, #7c3aed); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 12px; font-weight: 900; font-size: 14px; display: inline-block;">
            🎟️ VIEW MY TICKETS IN LOBBY
          </a>
        </div>
      `;
      break;
    }

    case 'game_start': {
      const name = data.userName || 'Player';
      const gameTitle = data.gameTitle || 'Live Super Housie';
      const gameCode = data.gameCode || 'TB-101';
      const pool = data.prizePool || '50,000';

      subject = `🔴 GAME IS LIVE NOW! Join ${gameTitle} and Claim Prizes 🏆`;
      contentHtml = `
        <div style="text-align: center; margin-bottom: 22px;">
          <div style="display: inline-block; background: #ef4444; color: #ffffff; padding: 4px 14px; border-radius: 999px; font-weight: 900; font-size: 11px; text-transform: uppercase; animation: pulse 2s infinite;">
            🔴 LIVE NOW IN CALLER ROOM
          </div>
          <h2 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 12px 0 6px 0;">Number Calling Has Begun! 🎲</h2>
          <p style="color: #cbd5e1; font-size: 14px; margin: 0;">Namaste ${name}, your match <strong>${gameTitle} (${gameCode})</strong> is currently in progress.</p>
        </div>

        <div style="background: #1e1b4b; border: 2px solid #eab308; border-radius: 16px; padding: 20px; text-align: center; margin: 20px 0;">
          <div style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase;">TOURNAMENT PRIZE POOL</div>
          <div style="color: #fbbf24; font-size: 34px; font-weight: 900; margin: 6px 0;">₹${pool}</div>
          <p style="color: #cbd5e1; font-size: 13px; margin: 0;">Early 5, Top Line, Middle Line, Bottom Line, and Full House prizes are open to claim right now!</p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="https://apnatambola.com" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 12px; font-weight: 900; font-size: 16px; display: inline-block; box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);">
            🔴 ENTER LIVE GAME ROOM NOW
          </a>
        </div>
      `;
      break;
    }

    case 'winning': {
      const name = data.userName || 'Player';
      const prizeName = data.prizeName || 'Full House';
      const winAmount = data.winningAmount || '3,500';
      const gameTitle = data.gameTitle || 'Mega Bumper Jackpot';
      const ticketId = data.ticketId || 'TKT-9824-712';
      const winNum = data.winningNumber || '76';
      const newBal = data.walletBalance || '4,280';

      subject = `🏆 BINGO! You Won ₹${winAmount} in ${gameTitle}! 🎊`;
      contentHtml = `
        <div style="text-align: center; margin-bottom: 22px;">
          <div style="font-size: 48px; line-height: 1;">👑 🎊 🥳</div>
          <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #eab308); color: #020617; padding: 6px 18px; border-radius: 999px; font-weight: 900; font-size: 13px; text-transform: uppercase; margin-top: 10px;">
            OFFICIAL WINNER CERTIFICATE
          </div>
          <h2 style="color: #fbbf24; font-size: 26px; font-weight: 900; margin: 12px 0 6px 0;">BINGO! Congratulations ${name}!</h2>
          <p style="color: #cbd5e1; font-size: 14px; margin: 0;">You successfully claimed <strong>${prizeName}</strong> in <strong>${gameTitle}</strong>!</p>
        </div>

        <div style="background: linear-gradient(135deg, #1e1b4b, #311042); border: 2px solid #fbbf24; border-radius: 16px; padding: 22px; margin-bottom: 22px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Prize Category:</td>
              <td style="color: #ffffff; font-weight: 900; text-align: right;">${prizeName}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Winning Ticket:</td>
              <td style="color: #38bdf8; font-weight: 800; text-align: right; font-family: monospace;">${ticketId}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Winning Called Number:</td>
              <td style="color: #f59e0b; font-weight: 900; text-align: right;">#${winNum}</td>
            </tr>
            <tr style="border-top: 1px dashed rgba(251, 191, 36, 0.4);">
              <td style="color: #e2e8f0; font-size: 16px; font-weight: 900; padding: 12px 0 0 0;">Prize Money Won:</td>
              <td style="color: #4ade80; font-size: 24px; font-weight: 900; text-align: right; padding: 12px 0 0 0;">+ ₹${winAmount}</td>
            </tr>
          </table>
        </div>

        <div style="background: rgba(74, 222, 128, 0.1); border: 1px solid #4ade80; border-radius: 12px; padding: 14px; text-align: center; margin-bottom: 24px;">
          <p style="color: #4ade80; font-size: 13px; font-weight: 700; margin: 0;">
            ✓ ₹${winAmount} has been credited to your <strong>Winning Wallet</strong> (Available for instant cashout). Updated Wallet: <strong>₹${newBal}</strong>
          </p>
        </div>

        <div style="text-align: center;">
          <a href="https://apnatambola.com" style="background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 900; font-size: 15px; display: inline-block;">
            💸 WITHDRAW WINNINGS TO UPI
          </a>
        </div>
      `;
      break;
    }

    case 'withdrawal_request': {
      const name = data.userName || 'Player';
      const amount = data.amount || '1,500';
      const method = data.paymentMethod || 'UPI';
      const upi = data.upiIdOrBank || 'user@upi';
      const ref = data.referenceId || `WDR-${Date.now()}`;
      const date = data.requestDate || new Date().toLocaleString();

      subject = `💸 Withdrawal Request Received: ₹${amount} [Ref: ${ref}]`;
      contentHtml = `
        <div style="text-align: center; margin-bottom: 22px;">
          <div style="display: inline-block; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid #38bdf8; padding: 4px 14px; border-radius: 999px; font-weight: 800; font-size: 11px; text-transform: uppercase;">
            PAYOUT IN PROGRESS
          </div>
          <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 12px 0 4px 0;">Withdrawal Initiated</h2>
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">Hi ${name}, we received your payout request on ${date}.</p>
        </div>

        <div style="background: #1e1b4b; border-radius: 16px; padding: 20px; margin-bottom: 22px; border: 1px solid #4338ca;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Requested Amount:</td>
              <td style="color: #ffffff; font-weight: 900; font-size: 18px; text-align: right;">₹${amount}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Payment Channel:</td>
              <td style="color: #38bdf8; font-weight: 800; text-align: right;">${method}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Payout Account:</td>
              <td style="color: #fcd34d; font-weight: 800; text-align: right;">${upi}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Reference ID:</td>
              <td style="color: #94a3b8; font-family: monospace; text-align: right;">${ref}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Estimated Time:</td>
              <td style="color: #4ade80; font-weight: 800; text-align: right;">5 to 15 Minutes</td>
            </tr>
          </table>
        </div>

        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
          Our automated bank gateway is processing your transfer. You will receive an instant confirmation email with UTR once completed.
        </p>
      `;
      break;
    }

    case 'withdrawal_status': {
      const name = data.userName || 'Player';
      const amount = data.amount || '1,500';
      const status = data.status || 'Approved';
      const isApproved = status.toLowerCase() === 'approved';
      const utr = data.utrNumber || 'IMPS-9823019842';
      const remarks = data.remarks || (isApproved ? 'Successfully credited to your account' : 'Rejected by security check');
      const ref = data.referenceId || `WDR-${Date.now()}`;

      subject = isApproved
        ? `✅ Withdrawal Approved: ₹${amount} Credited to Your Account`
        : `⚠️ Withdrawal Update: ₹${amount} Request ${status}`;

      contentHtml = `
        <div style="text-align: center; margin-bottom: 22px;">
          <div style="display: inline-block; background: ${isApproved ? '#10b981' : '#ef4444'}; color: #ffffff; padding: 5px 16px; border-radius: 999px; font-weight: 900; font-size: 12px; text-transform: uppercase;">
            ${isApproved ? '✓ PAYOUT COMPLETED' : '⚠️ WITHDRAWAL REJECTED'}
          </div>
          <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 12px 0 4px 0;">
            ${isApproved ? 'Money Sent to Your Account! 💰' : 'Withdrawal Status Notice'}
          </h2>
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">Hi ${name}, here is the update regarding withdrawal reference <strong>${ref}</strong>.</p>
        </div>

        <div style="background: #1e1b4b; border-radius: 16px; padding: 20px; margin-bottom: 22px; border: 2px solid ${isApproved ? '#10b981' : '#ef4444'};">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Amount:</td>
              <td style="color: #ffffff; font-weight: 900; font-size: 20px; text-align: right;">₹${amount}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Status:</td>
              <td style="color: ${isApproved ? '#4ade80' : '#f87171'}; font-weight: 900; text-align: right; text-transform: uppercase;">${status}</td>
            </tr>
            ${
              isApproved
                ? `
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Bank UTR / Ref No:</td>
              <td style="color: #38bdf8; font-weight: 800; text-align: right; font-family: monospace;">${utr}</td>
            </tr>
            `
                : ''
            }
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Admin Remarks:</td>
              <td style="color: #cbd5e1; text-align: right;">${remarks}</td>
            </tr>
          </table>
        </div>

        ${
          !isApproved
            ? `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 12px; padding: 14px; text-align: center; color: #fca5a5; font-size: 13px;">
          The requested amount of ₹${amount} has been safely refunded back to your Winning Wallet. Please review your bank/UPI details or reach out to support.
        </div>
        `
            : `
        <div style="text-align: center;">
          <a href="https://apnatambola.com" style="background: linear-gradient(135deg, #eab308, #f59e0b); color: #020617; text-decoration: none; padding: 14px 30px; border-radius: 12px; font-weight: 900; font-size: 14px; display: inline-block;">
            🎮 PLAY NEXT TOURNAMENT
          </a>
        </div>
        `
        }
      `;
      break;
    }

    case 'wallet_transaction': {
      const name = data.userName || 'Player';
      const txnType = data.txnType || 'Deposit';
      const amount = data.amount || '500';
      const ref = data.referenceId || `PAY-${Date.now()}`;
      const method = data.paymentMethod || 'Instant UPI';
      const balance = data.balanceAfter || '1,250';
      const date = data.date || new Date().toLocaleString();

      subject = `💳 Wallet Transaction Confirmed: ₹${amount} [${txnType}]`;
      contentHtml = `
        <div style="text-align: center; margin-bottom: 22px;">
          <div style="display: inline-block; background: #10b981; color: #022c22; padding: 4px 14px; border-radius: 999px; font-weight: 900; font-size: 11px; text-transform: uppercase;">
            TRANSACTION SUCCESSFUL
          </div>
          <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 12px 0 4px 0;">Wallet Balance Updated 🪙</h2>
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">Hi ${name}, your wallet has been updated on ${date}.</p>
        </div>

        <div style="background: #1e1b4b; border-radius: 16px; padding: 20px; margin-bottom: 22px; border: 1px solid #6366f1;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Transaction Type:</td>
              <td style="color: #ffffff; font-weight: 800; text-align: right;">${txnType}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Amount:</td>
              <td style="color: #4ade80; font-weight: 900; font-size: 18px; text-align: right;">+ ₹${amount}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Payment Channel:</td>
              <td style="color: #38bdf8; font-weight: 800; text-align: right;">${method}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Reference ID:</td>
              <td style="color: #cbd5e1; font-family: monospace; text-align: right;">${ref}</td>
            </tr>
            <tr style="border-top: 1px dashed rgba(255,255,255,0.1);">
              <td style="color: #e2e8f0; font-weight: 700; padding: 10px 0 0 0;">New Total Balance:</td>
              <td style="color: #f59e0b; font-size: 18px; font-weight: 900; text-align: right; padding: 10px 0 0 0;">₹${balance}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center;">
          <a href="https://apnatambola.com" style="background: linear-gradient(135deg, #eab308, #f59e0b); color: #020617; text-decoration: none; padding: 14px 30px; border-radius: 12px; font-weight: 900; font-size: 14px; display: inline-block;">
            🎟️ BOOK UPCOMING TOURNAMENTS
          </a>
        </div>
      `;
      break;
    }

    case 'referral_commission': {
      const name = data.userName || 'Affiliate Partner';
      const commAmount = data.commissionAmount || '25.00';
      const level = data.level || '1';
      const pct = data.percentage || '4.0%';
      const sourceUser = data.sourceUserName || 'Team Member';
      const gameTitle = data.gameTitle || 'Grand Maha Housie';
      const totalRef = data.newReferralBalance || '1,840.50';

      subject = `🤝 Level ${level} Commission Earned! ₹${commAmount} Added to Wallet 💰`;
      contentHtml = `
        <div style="text-align: center; margin-bottom: 22px;">
          <div style="font-size: 40px; line-height: 1;">💎 🤝 💰</div>
          <div style="display: inline-block; background: linear-gradient(135deg, #38bdf8, #0284c7); color: #ffffff; padding: 5px 16px; border-radius: 999px; font-weight: 900; font-size: 12px; text-transform: uppercase; margin-top: 8px;">
            5-LEVEL AFFILIATE PASSIVE INCOME
          </div>
          <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 12px 0 4px 0;">Commission Credited!</h2>
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">Hi ${name}, your downline team member <strong>${sourceUser}</strong> just played a tournament!</p>
        </div>

        <div style="background: linear-gradient(135deg, #1e1b4b, #0f172a); border: 2px solid #38bdf8; border-radius: 16px; padding: 20px; margin-bottom: 22px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Affiliate Level:</td>
              <td style="color: #38bdf8; font-weight: 900; text-align: right;">Level ${level} (${pct})</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Source Downline:</td>
              <td style="color: #ffffff; font-weight: 800; text-align: right;">${sourceUser}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Tournament:</td>
              <td style="color: #cbd5e1; text-align: right;">${gameTitle}</td>
            </tr>
            <tr style="border-top: 1px dashed rgba(56, 189, 248, 0.4);">
              <td style="color: #e2e8f0; font-size: 15px; font-weight: 900; padding: 10px 0 0 0;">Commission Earned:</td>
              <td style="color: #4ade80; font-size: 22px; font-weight: 900; text-align: right; padding: 10px 0 0 0;">+ ₹${commAmount}</td>
            </tr>
          </table>
        </div>

        <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid #38bdf8; border-radius: 12px; padding: 14px; text-align: center; margin-bottom: 24px;">
          <p style="color: #7dd3fc; font-size: 13px; font-weight: 700; margin: 0;">
            Total Referral Wallet Balance: <strong>₹${totalRef}</strong> (Directly withdrawable to Bank/UPI without playing requirements).
          </p>
        </div>

        <div style="text-align: center;">
          <a href="https://apnatambola.com" style="background: linear-gradient(135deg, #38bdf8, #0284c7); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 12px; font-weight: 900; font-size: 14px; display: inline-block;">
            👥 VIEW AFFILIATE TEAM DASHBOARD
          </a>
        </div>
      `;
      break;
    }
  }

  // Wrap in Master Responsive HTML Layout
  const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 12px !important; }
      .email-card { padding: 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #090614; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #090614; padding: 24px 0;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table role="presentation" class="email-container" width="600" border="0" cellspacing="0" cellpadding="0" style="width: 600px; max-width: 600px; margin: 0 auto; background-color: #120d24; border-radius: 20px; overflow: hidden; border: 1px solid #2e1e4a; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Brand Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e1035 0%, #2b103e 50%, #150a29 100%); padding: 28px 24px; text-align: center; border-bottom: 2px solid #eab308;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: #020617; border: 2px solid #eab308; border-radius: 16px; padding: 8px 18px; margin-bottom: 10px;">
                      <span style="color: #fbbf24; font-weight: 900; font-size: 20px; letter-spacing: 1px;">APNA TAMBOLA</span>
                      <span style="color: #f59e0b; font-size: 13px; margin-left: 6px; font-weight: bold;">अपना तंबोला</span>
                    </div>
                    <div style="color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
                      Real-Time Multiplayer Housie Tournament Portal
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td class="email-card" style="padding: 32px 28px; background-color: #120d24;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0a0614; padding: 24px; text-align: center; border-top: 1px solid #1f1433;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0; line-height: 1.5;">
                ${footerText}
              </p>
              <p style="color: #64748b; font-size: 11px; margin: 0 0 12px 0;">
                Support Helpline: <strong style="color: #fbbf24;">${supportPhone}</strong> | Official Portal: <a href="https://apnatambola.com" style="color: #38bdf8; text-decoration: none;">apnatambola.com</a>
              </p>
              <div style="color: #475569; font-size: 10px; margin-top: 10px;">
                © ${currentYear} ${brandName}. All rights reserved. This is an automated transactional security email.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html: fullHtml };
}
