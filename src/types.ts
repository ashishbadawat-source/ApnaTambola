export type Role = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  username?: string;
  role: Role;
  status?: 'active' | 'blocked' | 'inactive';
  isBlocked?: boolean;
  walletBalance: number; // Deposit + Winning + Referral
  depositBalance: number;
  winningBalance: number;
  referralBalance: number;
  bonusRewardBalance?: number; // 🎁 Daily Spin / Scratch / Check-in Rewards Wallet (Unlocks 10% on Admin Recharge)
  firstDepositBonusClaimed?: boolean; // 🎁 ₹10 Registration Bonus added automatically upon 1st deposit
  hasDeposited?: boolean;
  kycStatus: 'verified' | 'pending' | 'rejected' | 'unverified';
  isKycVerified?: boolean;
  level?: number;
  gamesPlayed?: number;
  totalWinnings?: number;
  totalWon?: number;
  referralCount?: number;
  referralCode: string;
  referredBy?: string; // referrer's referralCode
  referredByUserId?: string; // referrer's User ID for direct linkage
  referrer_id?: string | null; // database-backed direct referrer ID (e.g. AT10001 or usr_...)
  user_id?: string; // database alias for ID
  user_name?: string;
  mobile?: string;
  avatar: string;
  createdAt: string;
  created_at?: string;
  lastLoginAt?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    upiId: string;
    accountHolder?: string;
  };
}

export type TicketColorThemeId =
  | 'multi'
  | 'ruby'
  | 'emerald'
  | 'amber'
  | 'cyan'
  | 'purple'
  | 'rose'
  | 'sapphire'
  | 'orange'
  | 'lime'
  | 'gold';

export interface TambolaTicket {
  id: string;
  gameId: string;
  gameTitle: string;
  userId: string;
  userName: string;
  ticketNumber: number; // e.g. Ticket #1
  ticketId: string; // unique code e.g. TKT-9824-712
  numbers: number[][]; // 3 rows x 9 cols (0 for empty cell)
  markedNumbers: number[];
  price: number;
  purchaseDate: string;
  colorTheme?: TicketColorThemeId;
  autoMode?: boolean; // Auto-track and auto-claim prizes even when offline
  isWinner?: boolean;
  isWinningTicket?: boolean;
  wonPrizes?: string[];
  qrCodeData?: string;
  isActive?: boolean; // Admin ON / OFF toggle for individual ticket (Default true: ON / चालू, false: OFF / बंद)
  status?: 'active' | 'void' | 'disabled' | 'refunded';
  disabledReason?: string;
}

export type PrizeCode =
  | 'early5'
  | 'early_five'
  | 'star'
  | 'corners'
  | 'top_line'
  | 'mid_line'
  | 'bot_line'
  | 'full_house'
  | 'second_full_house'
  | 'third_full_house'
  | 'special';

export interface GamePrize {
  id: string;
  code: PrizeCode;
  name: string;
  amount: number;
  maxWinners: number;
  claimedWinners: {
    userId: string;
    userName: string;
    ticketId: string;
    ticketNumber: number;
    winningNumber: number;
    claimedAt: string;
  }[];
  description: string;
}

export type GameStatus = 'upcoming' | 'live' | 'completed' | 'cancelled';

export interface TambolaGame {
  id: string;
  title: string;
  gameCode: string;
  date: string;
  startTime: string;
  scheduledStartIso?: string;
  ticketPrice: number;
  maxPlayers: number;
  registeredPlayers: number;
  totalTicketsSold: number;
  soldTickets?: number;
  totalTickets?: number;
  maxTicketsPerUser?: number;
  prizePool: number;
  ticketColorTheme?: TicketColorThemeId;
  status: GameStatus;
  isGameEnabled?: boolean; // Admin Master ON / OFF toggle for entire game (Default true: ON / चालू, false: OFF / बंद)
  isActive?: boolean; // Alias for isGameEnabled
  isBookingOpen?: boolean; // Admin ON / OFF toggle for ticket booking (Default true: Booking Open / चालू, false: Booking Closed / बंद)
  bookingOpen?: boolean; // Alias for isBookingOpen
  bookingClosedMessage?: string; // Custom message when booking is closed
  calledNumbers: number[];
  currentNumber: number | null;
  lastCalledNumber?: number | null;
  previousNumbers: number[];
  autoCalling: boolean;
  callIntervalSeconds: number;
  voiceLanguage?: 'en' | 'hi' | 'both';
  prizes: GamePrize[];
  rules: string;
  createdAt: string;
}

export interface GameWinner {
  id: string;
  gameId: string;
  gameTitle: string;
  prizeId: string;
  prizeCode: PrizeCode;
  prizeName: string;
  prizeAmount: number;
  userId: string;
  userName: string;
  ticketId: string;
  ticketNumber: number;
  winningNumber: number;
  date: string;
  timestamp?: string;
}

export interface ReferralLevelConfig {
  level: number;
  percentage: number;
  label: string;
}

export interface ReferralCommission {
  id: string;
  userId: string; // Recipient of commission
  userName: string;
  sourceUserId: string; // Buyer who generated commission
  sourceUserName: string;
  gameId: string;
  gameTitle: string;
  ticketId: string;
  level: number;
  percentage: number;
  baseAmount: number;
  commissionAmount: number;
  transactionId: string;
  timestamp: string;
  status: 'approved' | 'pending' | 'reversed';
}

export interface ReferralMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  level: number;
  joinedDate: string;
  ticketsBought: number;
  commissionEarned: number;
  avatar: string;
}

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'ticket_purchase'
  | 'prize_won'
  | 'referral_commission'
  | 'signup_bonus'
  | 'refund'
  | 'p2p_transfer_sent'
  | 'p2p_transfer_received'
  | 'internal_transfer'
  | 'daily_reward_claim'
  | 'reward_bonus_unlock';

export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'reversed';

export interface WalletTransaction {
  id: string;
  userId: string;
  userName?: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  paymentMethod?: string;
  referenceId?: string;
  utrNumber?: string;
  proofImageUrl?: string;
  adminNotes?: string;
  timestamp: string;
  balanceAfter: number;
  recipientId?: string;
  recipientName?: string;
  recipientPhone?: string;
  senderId?: string;
  senderName?: string;
  transferFee?: number;
  netTransferAmount?: number;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  amount: number;
  paymentMethod: string;
  utrNumber: string;
  proofImageUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  processedDate?: string;
  adminRemarks?: string;
  registrationBonus?: number;
  bonusRewardUnlock?: number;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  amount: number;
  tdsPercentage?: number; // 10%
  tdsAmount?: number; // 10% of amount
  adminFeePercentage?: number; // 5%
  adminFeeAmount?: number; // 5% of amount
  totalDeductions?: number; // 15% of amount
  netAmount?: number; // 85% of amount (net payout)
  paymentMethod: 'upi' | 'bank';
  upiId?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  accountHolder?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  processedDate?: string;
  note?: string;
  adminRemarks?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: 'wallet' | 'game' | 'ticket' | 'referral' | 'kyc' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  ticketCode?: string;
  messages: {
    id: string;
    sender: 'user' | 'admin';
    senderName: string;
    text: string;
    time: string;
    timestamp?: string;
    message?: string;
  }[];
}

export interface AdminStats {
  totalUsers: number;
  activeGames: number;
  ticketsSold: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  totalReferralCommissionsPaid: number;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  supportWhatsapp?: string;
  noticeMarquee?: string;
  referralSystemEnabled: boolean;
  minWithdrawal: number;
  maxWithdrawalPerDay: number;
  withdrawalMultiple?: number; // Multiple of 100
  tdsPercentage?: number; // 10%
  adminFeePercentage?: number; // 5%
  minDeposit?: number; // 100
  maxDeposit?: number;
  depositMultiple?: number; // Multiple of 100
  withdrawalFeePercentage: number;
  levelPercentages: number[];
  maintenanceMode: boolean;
  announcementText: string;
  responsibleGamingInfo: string;
  termsAndConditions: string;
  privacyPolicy: string;
  refundPolicy?: string;
  contactAddress?: string;
  facebookUrl?: string;
  telegramUrl?: string;
  whatsappNumber?: string;
  youtubeUrl?: string;
  themeColor?: string;
  
  // Tawk.to Live Chat & Ticketing Integration
  tawkSiteId?: string;
  tawkApiKey?: string;
  ticketEmail?: string;
  
  // Admin Payment & UPI QR Settings
  adminUpiId?: string; // e.g. "tambolalive@upi" or "9876543210@paytm"
  adminUpiName?: string; // e.g. "Tambola Live Official"
  adminQrCodeUrl?: string; // Custom QR code image URL or data URL
  adminBankName?: string; // e.g. "HDFC Bank / State Bank of India"
  adminAccountNo?: string; // e.g. "5020001928374"
  adminIfsc?: string; // e.g. "HDFC0001234"
  adminAccountHolder?: string; // e.g. "Tambola Live India Pvt Ltd"
  adminUpiNote?: string; // Note displayed to users during payment

  // P2P User-to-User Fund Transfer Fee (default 5%)
  p2pTransferFeePercentage?: number;

  // Voice Caller Language Configuration
  voiceLanguage?: 'en' | 'hi' | 'both';

  // Global Default Ticket Color Theme set by Admin
  defaultTicketTheme?: TicketColorThemeId;

  // Master Admin Credentials
  adminUsername?: string;
  adminPassword?: string;
}

export interface ActivityLog {
  id: string;
  adminName: string;
  action: string;
  category: 'game' | 'user' | 'wallet' | 'withdrawal' | 'settings' | 'security' | 'ticket';
  ipAddress: string;
  device: string;
  timestamp: string;
  status: 'success' | 'warning' | 'danger';
  details?: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'push' | 'in_app' | 'game_announcement' | 'winner_announcement' | 'sms' | 'email' | 'info' | 'success' | 'warning' | 'urgent';
  targetAudience: 'all' | 'active_players' | 'vip_players' | 'new_players' | 'referrers' | 'single';
  status?: 'sent' | 'scheduled' | 'draft';
  channel?: 'in_app' | 'push' | 'sms' | 'whatsapp' | 'email';
  createdAt?: string;
  sentAt?: string;
  sentCount?: number;
  readCount?: number;
  totalRecipients?: number;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  userName: string;
  role?: string;
  ip: string;
  ipAddress?: string;
  device: string;
  location: string;
  time: string;
  timestamp?: string;
  status: 'success' | 'failed';
}

// 📧 Brevo Transactional Email System Types
export type EmailEventType =
  | 'user_registration'
  | 'email_verification'
  | 'password_reset'
  | 'ticket_purchase'
  | 'game_start'
  | 'winning'
  | 'withdrawal_request'
  | 'withdrawal_status'
  | 'wallet_transaction'
  | 'referral_commission';

export interface EmailLogEntry {
  id: string;
  eventType: EmailEventType;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status: 'sent' | 'delivered' | 'failed' | 'simulated';
  deliveryMethod: 'brevo_api' | 'smtp' | 'simulated';
  messageId?: string;
  errorMessage?: string;
  htmlPreview?: string;
  sentAt: string;
  payloadData?: Record<string, any>;
}

export interface BrevoEmailSettings {
  apiKey: string; // Brevo API key (stored securely on backend)
  senderName: string;
  senderEmail: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  isConfigured: boolean;
  dailyLimit: number; // 300 Free tier default
  emailsSentToday: number;
  lastResetDate: string;
  eventToggles: Record<EmailEventType, boolean>;
  customSubjects: Record<EmailEventType, string>;
  footerText?: string;
  supportPhone?: string;
}

export interface EmailTemplateDefinition {
  id: EmailEventType;
  name: string;
  category: 'Account & Security' | 'Gameplay & Tickets' | 'Finance & Wallet' | 'Affiliate';
  description: string;
  defaultSubject: string;
  supportedVariables: { key: string; label: string; example: string }[];
}
