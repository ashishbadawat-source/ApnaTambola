import { BrevoEmailSettings, EmailEventType, EmailLogEntry } from '../types';
import { generateEmailHtml, EMAIL_TEMPLATE_DEFINITIONS } from '../utils/emailTemplates';

// Brevo Settings in Backend Memory initialized with process.env
export let brevoSettings: BrevoEmailSettings = {
  apiKey: process.env.BREVO_API_KEY || '',
  senderName: process.env.BREVO_SENDER_NAME || 'Apna Tambola Official',
  senderEmail: process.env.BREVO_SENDER_EMAIL || 'support@apnatambola.com',
  smtpHost: process.env.BREVO_SMTP_SERVER || 'smtp-relay.brevo.com',
  smtpPort: Number(process.env.BREVO_SMTP_PORT) || 587,
  smtpUser: process.env.BREVO_SMTP_USER || '',
  smtpPass: process.env.BREVO_SMTP_PASSWORD || '',
  isConfigured: !!(process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim().length > 5),
  dailyLimit: 300, // Brevo Free Tier default: 300 free emails per day
  emailsSentToday: 6,
  lastResetDate: new Date().toISOString().split('T')[0],
  eventToggles: {
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
  },
  customSubjects: {
    user_registration: '🎉 Welcome to Apna Tambola! Your ₹50 Bonus is Active 🪙',
    email_verification: '🔐 Your Apna Tambola Verification Code: {{otpCode}}',
    password_reset: '🔑 Reset Your Apna Tambola Password [Code: {{resetOtp}}]',
    ticket_purchase: '🎟️ Ticket Confirmed! {{gameTitle}} [Ticket: {{ticketId}}]',
    game_start: '🔴 GAME IS LIVE NOW! Join {{gameTitle}} and Claim Prizes 🏆',
    winning: '🏆 BINGO! You Won ₹{{winningAmount}} in {{gameTitle}}! 🎊',
    withdrawal_request: '💸 Withdrawal Request Received: ₹{{amount}} [Ref: {{referenceId}}]',
    withdrawal_status: '✅ Withdrawal {{status}}: ₹{{amount}} Credited to Your Account',
    wallet_transaction: '💳 Wallet Transaction Confirmed: ₹{{amount}} [{{txnType}}]',
    referral_commission: '🤝 Level {{level}} Commission Earned! ₹{{commissionAmount}} Added to Wallet 💰',
  },
  footerText: 'India’s #1 Real-Time Multiplayer Housie Tournament Portal. Play Responsibly. 18+ Only.',
  supportPhone: '+91 98765 43210',
};

// Initial Seed Email Logs for demonstration & quick inspection
export let emailLogs: EmailLogEntry[] = [
  {
    id: 'elog_101',
    eventType: 'winning',
    recipientEmail: 'ashishbadawat@gmail.com',
    recipientName: 'Ashish Badawat',
    subject: '🏆 BINGO! You Won ₹3,500 in ₹50 Mega Bumper Jackpot! 🎊',
    status: 'sent',
    deliveryMethod: 'brevo_api',
    messageId: '<202608220530.brevo.win9824@smtp-relay.brevo.com>',
    sentAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    payloadData: {
      prizeName: 'Full House (1st)',
      winningAmount: '3500',
      gameTitle: '₹50 Mega Bumper Jackpot',
      ticketId: 'TKT-9824-712',
      winningNumber: 76,
      walletBalance: '4,280',
    },
    htmlPreview: generateEmailHtml('winning', {
      userName: 'Ashish Badawat',
      prizeName: 'Full House (1st)',
      winningAmount: '3,500',
      gameTitle: '₹50 Mega Bumper Jackpot',
      ticketId: 'TKT-9824-712',
      winningNumber: 76,
      walletBalance: '4,280',
    }).html,
  },
  {
    id: 'elog_102',
    eventType: 'ticket_purchase',
    recipientEmail: 'ashishbadawat@gmail.com',
    recipientName: 'Ashish Badawat',
    subject: '🎟️ Ticket Confirmed! ₹50 Mega Bumper Jackpot [Ticket: TKT-9824-712]',
    status: 'sent',
    deliveryMethod: 'brevo_api',
    messageId: '<202608220512.brevo.tkt7741@smtp-relay.brevo.com>',
    sentAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    payloadData: {
      gameTitle: '₹50 Mega Bumper Jackpot',
      ticketId: 'TKT-9824-712',
      ticketCount: 2,
      totalPaid: 100,
      gameTime: 'Today at 09:00 PM',
      prizePool: '10,920',
    },
    htmlPreview: generateEmailHtml('ticket_purchase', {
      userName: 'Ashish Badawat',
      gameTitle: '₹50 Mega Bumper Jackpot',
      ticketId: 'TKT-9824-712',
      ticketCount: 2,
      totalPaid: 100,
      gameTime: 'Today at 09:00 PM',
      prizePool: '10,920',
    }).html,
  },
  {
    id: 'elog_103',
    eventType: 'withdrawal_status',
    recipientEmail: 'rahul.tambola@gmail.com',
    recipientName: 'Rahul Sharma',
    subject: '✅ Withdrawal Approved: ₹1,500 Credited to Your Account',
    status: 'sent',
    deliveryMethod: 'brevo_api',
    messageId: '<202608220450.brevo.wdr3391@smtp-relay.brevo.com>',
    sentAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    payloadData: {
      amount: 1500,
      status: 'Approved',
      utrNumber: 'IMPS-9823019842',
      remarks: 'Processed via automated IMPS',
      referenceId: 'WDR-9812-441',
    },
    htmlPreview: generateEmailHtml('withdrawal_status', {
      userName: 'Rahul Sharma',
      amount: '1,500',
      status: 'Approved',
      utrNumber: 'IMPS-9823019842',
      remarks: 'Processed via automated IMPS',
      referenceId: 'WDR-9812-441',
    }).html,
  },
  {
    id: 'elog_104',
    eventType: 'referral_commission',
    recipientEmail: 'ashishbadawat@gmail.com',
    recipientName: 'Ashish Badawat',
    subject: '🤝 Level 1 Commission Earned! ₹25.00 Added to Wallet 💰',
    status: 'sent',
    deliveryMethod: 'brevo_api',
    messageId: '<202608220420.brevo.ref4421@smtp-relay.brevo.com>',
    sentAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    payloadData: {
      commissionAmount: '25.00',
      level: 1,
      percentage: '4.0%',
      sourceUserName: 'Amit Patel',
      gameTitle: '₹100 Grand Weekend Maha Housie',
      newReferralBalance: '1,840.50',
    },
    htmlPreview: generateEmailHtml('referral_commission', {
      userName: 'Ashish Badawat',
      commissionAmount: '25.00',
      level: 1,
      percentage: '4.0%',
      sourceUserName: 'Amit Patel',
      gameTitle: '₹100 Grand Weekend Maha Housie',
      newReferralBalance: '1,840.50',
    }).html,
  },
  {
    id: 'elog_105',
    eventType: 'user_registration',
    recipientEmail: 'priya.verma@example.com',
    recipientName: 'Priya Verma',
    subject: '🎉 Welcome to Apna Tambola! Your ₹50 Bonus is Active 🪙',
    status: 'sent',
    deliveryMethod: 'brevo_api',
    messageId: '<202608220330.brevo.reg0912@smtp-relay.brevo.com>',
    sentAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    payloadData: {
      bonusAmount: '50',
      referralCode: 'PRIYA88',
    },
    htmlPreview: generateEmailHtml('user_registration', {
      userName: 'Priya Verma',
      bonusAmount: '50',
      referralCode: 'PRIYA88',
    }).html,
  },
  {
    id: 'elog_106',
    eventType: 'email_verification',
    recipientEmail: 'invalid.mailbox@test-domain-bounce.xyz',
    recipientName: 'Test Sandbox',
    subject: '🔐 Your Apna Tambola Verification Code: 948123',
    status: 'failed',
    deliveryMethod: 'brevo_api',
    errorMessage: 'Recipient domain DNS MX lookup failed or rejected by upstream mail server',
    sentAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    payloadData: {
      otpCode: '948123',
      expiresInMinutes: '10',
    },
    htmlPreview: generateEmailHtml('email_verification', {
      userName: 'Test Sandbox',
      otpCode: '948123',
      expiresInMinutes: '10',
    }).html,
  },
];

// Helper to mask sensitive API key for frontend display
export function getMaskedSettings(): BrevoEmailSettings {
  const isKeyPresent = !!(brevoSettings.apiKey && brevoSettings.apiKey.trim().length > 5);
  let maskedKey = '';
  if (isKeyPresent) {
    const raw = brevoSettings.apiKey.trim();
    maskedKey = raw.length > 8 ? `${raw.slice(0, 6)}...${raw.slice(-4)}` : 'xkeysib-***-xxxx';
  }

  // Check and reset daily sent count if day rolled over
  const today = new Date().toISOString().split('T')[0];
  if (brevoSettings.lastResetDate !== today) {
    brevoSettings.emailsSentToday = 0;
    brevoSettings.lastResetDate = today;
  }

  return {
    ...brevoSettings,
    apiKey: maskedKey,
    isConfigured: isKeyPresent,
  };
}

// Master Server-Side Brevo Email Dispatcher
export async function sendBrevoEmail(
  eventType: EmailEventType,
  recipientEmail: string,
  recipientName: string = 'Player',
  data: Record<string, any> = {},
  forceSend: boolean = false
): Promise<{
  success: boolean;
  messageId?: string;
  log?: EmailLogEntry;
  error?: string;
  deliveryMethod?: 'brevo_api' | 'smtp' | 'simulated';
}> {
  // Validate recipient email
  if (!recipientEmail || !recipientEmail.includes('@') || recipientEmail.trim().length < 5) {
    return { success: false, error: 'Invalid recipient email address.' };
  }

  // Check if event notification is enabled by admin
  if (!forceSend && brevoSettings.eventToggles[eventType] === false) {
    console.log(`[Email Skipped] Event '${eventType}' is toggled OFF by admin.`);
    return { success: false, error: `Email notification for '${eventType}' is disabled by Admin.` };
  }

  // Generate responsive HTML & subject
  const { subject: generatedSubject, html } = generateEmailHtml(eventType, { ...data, userName: recipientName }, {
    senderName: brevoSettings.senderName,
    footerText: brevoSettings.footerText,
    supportPhone: brevoSettings.supportPhone,
  });

  // Check for custom subject override
  let subject = brevoSettings.customSubjects[eventType] || generatedSubject;
  // Replace simple variable tokens in subject
  Object.keys(data).forEach((k) => {
    subject = subject.replace(new RegExp(`{{${k}}}`, 'g'), String(data[k]));
  });
  subject = subject.replace(/{{userName}}/g, recipientName);

  const activeApiKey = (brevoSettings.apiKey || process.env.BREVO_API_KEY || '').trim();
  const hasRealKey = activeApiKey.length > 10 && !activeApiKey.includes('***');

  const logId = `elog_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

  if (hasRealKey) {
    try {
      console.log(`[Brevo API] Dispatching '${eventType}' email to ${recipientEmail}...`);

      const brevoPayload = {
        sender: {
          name: brevoSettings.senderName || 'Apna Tambola Official',
          email: brevoSettings.senderEmail || 'support@apnatambola.com',
        },
        to: [
          {
            email: recipientEmail.trim(),
            name: recipientName || 'Player',
          },
        ],
        subject: subject,
        htmlContent: html,
      };

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': activeApiKey,
          'content-type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify(brevoPayload),
      });

      const responseData: any = await response.json();

      if (!response.ok) {
        const errorMsg = responseData?.message || responseData?.error || `Brevo HTTP error ${response.status}`;
        console.error('[Brevo Error]', errorMsg);

        const failedLog: EmailLogEntry = {
          id: logId,
          eventType,
          recipientEmail,
          recipientName,
          subject,
          status: 'failed',
          deliveryMethod: 'brevo_api',
          errorMessage: errorMsg,
          htmlPreview: html,
          sentAt: new Date().toISOString(),
          payloadData: data,
        };
        emailLogs.unshift(failedLog);
        return { success: false, error: errorMsg, log: failedLog };
      }

      // Success via Brevo API
      const messageId = responseData?.messageId || `<${Date.now()}@brevo.mail>`;
      brevoSettings.emailsSentToday += 1;

      const successLog: EmailLogEntry = {
        id: logId,
        eventType,
        recipientEmail,
        recipientName,
        subject,
        status: 'sent',
        deliveryMethod: 'brevo_api',
        messageId,
        htmlPreview: html,
        sentAt: new Date().toISOString(),
        payloadData: data,
      };
      emailLogs.unshift(successLog);

      console.log(`[Brevo Success] Email delivered. MessageID: ${messageId}`);
      return { success: true, messageId, log: successLog, deliveryMethod: 'brevo_api' };
    } catch (err: any) {
      console.error('[Brevo Dispatch Exception]', err);
      const failedLog: EmailLogEntry = {
        id: logId,
        eventType,
        recipientEmail,
        recipientName,
        subject,
        status: 'failed',
        deliveryMethod: 'brevo_api',
        errorMessage: err.message || 'Network exception while connecting to Brevo API',
        htmlPreview: html,
        sentAt: new Date().toISOString(),
        payloadData: data,
      };
      emailLogs.unshift(failedLog);
      return { success: false, error: err.message, log: failedLog };
    }
  } else {
    // Sandbox / Simulation Mode (when API key is not yet provided or in test sandbox)
    const simulatedMsgId = `<sim.${Date.now()}.${Math.floor(1000 + Math.random() * 9000)}@smtp-relay.brevo.com>`;
    brevoSettings.emailsSentToday += 1;

    const simLog: EmailLogEntry = {
      id: logId,
      eventType,
      recipientEmail,
      recipientName,
      subject,
      status: 'simulated',
      deliveryMethod: 'simulated',
      messageId: simulatedMsgId,
      htmlPreview: html,
      sentAt: new Date().toISOString(),
      payloadData: data,
    };
    emailLogs.unshift(simLog);

    console.log(`[Email Sandbox] '${eventType}' rendered for ${recipientEmail}. MessageId: ${simulatedMsgId}`);
    return {
      success: true,
      messageId: simulatedMsgId,
      deliveryMethod: 'simulated',
      log: simLog,
    };
  }
}
