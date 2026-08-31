-- =========================================================================
-- APNA TAMBOLA SUPABASE DATABASE SCHEMA (PostgreSQL)
-- Project ID: ztdfzpyxurdpljzphhgz (Region: Oceania Sydney ap-southeast-2)
-- Run this in your Supabase SQL Editor to set up all tables and indexes.
-- =========================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  role TEXT DEFAULT 'player', -- 'player', 'admin', 'moderator'
  wallet_balance NUMERIC(12,2) DEFAULT 0,
  winning_balance NUMERIC(12,2) DEFAULT 0,
  referral_balance NUMERIC(12,2) DEFAULT 0,
  bonus_balance NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'active', 'blocked', 'inactive'
  is_blocked BOOLEAN DEFAULT FALSE,
  kyc_status TEXT DEFAULT 'unverified', -- 'unverified', 'pending', 'verified', 'rejected'
  referral_code TEXT UNIQUE,
  referrer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  referred_by TEXT,
  referred_by_user_id TEXT,
  referral_count INTEGER DEFAULT 0,
  avatar TEXT,
  upi_id TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GAMES TABLE
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  ticket_price NUMERIC(10,2) NOT NULL,
  prize_pool NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'live', 'completed', 'cancelled'
  total_tickets_sold INTEGER DEFAULT 0,
  max_tickets INTEGER DEFAULT 500,
  is_booking_open BOOLEAN DEFAULT TRUE,
  current_number INTEGER,
  called_numbers INTEGER[] DEFAULT '{}',
  auto_calling BOOLEAN DEFAULT FALSE,
  call_interval INTEGER DEFAULT 6,
  prizes JSONB,
  winners JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TICKETS TABLE
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  numbers JSONB NOT NULL, -- 3x9 tambola grid array
  price NUMERIC(10,2) NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WALLET TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'ticket_purchase', 'prize_won', 'referral_commission', 'admin_adjustment'
  amount NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2),
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'rejected'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. WITHDRAWAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS withdrawals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_phone TEXT,
  amount NUMERIC(12,2) NOT NULL,
  upi_id TEXT,
  bank_account TEXT,
  bank_ifsc TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
  rejection_reason TEXT,
  transaction_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- 6. DEPOSITS TABLE
CREATE TABLE IF NOT EXISTS deposits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  amount NUMERIC(12,2) NOT NULL,
  utr_number TEXT,
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

-- 7. REFERRAL COMMISSIONS TABLE
CREATE TABLE IF NOT EXISTS referral_commissions (
  id TEXT PRIMARY KEY,
  sponsor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_name TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  ticket_amount NUMERIC(10,2) DEFAULT 0,
  commission_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INDEXES FOR HIGH-SPEED DOWNLINE & GAME SEARCHES
CREATE INDEX IF NOT EXISTS idx_users_referrer_id ON users(referrer_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_tickets_game_id ON tickets(game_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_sponsor ON referral_commissions(sponsor_id);
