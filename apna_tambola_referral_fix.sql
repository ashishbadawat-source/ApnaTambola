-- =========================================================================
-- APNA TAMBOLA - PRODUCTION REFERRAL SYSTEM ROOT FIX (PostgreSQL / Supabase)
-- =========================================================================

-- Enable pgcrypto for UUID/hash utilities
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. USERS / PROFILES TABLE SETUP & SCHEMA REFINEMENT
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  role TEXT DEFAULT 'player',
  wallet_balance NUMERIC(12,2) DEFAULT 0,
  winning_balance NUMERIC(12,2) DEFAULT 0,
  referral_balance NUMERIC(12,2) DEFAULT 0,
  bonus_balance NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  is_blocked BOOLEAN DEFAULT FALSE,
  kyc_status TEXT DEFAULT 'unverified',
  referral_code TEXT,
  referrer_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
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

-- Ensure columns exist if table was already created
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referrer_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by_user_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create profiles view or compatibility table if referenced
CREATE OR REPLACE VIEW public.profiles AS 
  SELECT * FROM public.users;

-- Safe foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_referrer_id'
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT fk_users_referrer_id
    FOREIGN KEY (referrer_id)
    REFERENCES public.users(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- 2. INDEXES FOR PERFORMANCE
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code_uniq ON public.users(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_referrer_id ON public.users(referrer_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- 3. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_user_id TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 4. UNIQUE REFERRAL CODE GENERATOR FUNCTION
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
  v_attempts INTEGER := 0;
BEGIN
  LOOP
    v_attempts := v_attempts + 1;
    -- Generate APNA + 3 to 5 alphanumeric digits
    v_code := 'APNA' || (100 + floor(random() * 900)::int)::text;
    IF v_attempts > 10 THEN
      v_code := 'APNA' || (1000 + floor(random() * 9000)::int)::text;
    END IF;

    SELECT EXISTS(
      SELECT 1 FROM public.users WHERE UPPER(referral_code) = UPPER(v_code)
    ) INTO v_exists;

    IF NOT v_exists THEN
      RETURN v_code;
    END IF;

    EXIT WHEN v_attempts > 100;
  END LOOP;

  -- Fallback with timestamp hash
  RETURN 'APNA' || substring(md5(random()::text || clock_timestamp()::text) from 1 for 5);
END;
$$;

-- 5. ATOMIC REGISTRATION RPC (Stored Procedure)
CREATE OR REPLACE FUNCTION register_user_with_referral(
  p_user_id TEXT,
  p_name TEXT,
  p_phone TEXT,
  p_referral_code TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sponsor_id TEXT := NULL;
  v_sponsor_code TEXT := NULL;
  v_new_ref_code TEXT;
  v_clean_code TEXT;
  v_user_record public.users%ROWTYPE;
BEGIN
  -- 1. Check if user already exists
  IF EXISTS(SELECT 1 FROM public.users WHERE id = p_user_id OR (phone IS NOT NULL AND phone = p_phone)) THEN
    SELECT * INTO v_user_record FROM public.users WHERE id = p_user_id OR phone = p_phone LIMIT 1;
    RETURN to_jsonb(v_user_record);
  END IF;

  -- 2. Validate referral code if provided
  IF p_referral_code IS NOT NULL AND TRIM(p_referral_code) <> '' THEN
    v_clean_code := UPPER(TRIM(p_referral_code));
    
    -- Find sponsor
    SELECT id, referral_code INTO v_sponsor_id, v_sponsor_code
    FROM public.users
    WHERE UPPER(referral_code) = v_clean_code
       OR UPPER(id) = v_clean_code
    LIMIT 1;

    IF v_sponsor_id IS NULL THEN
      -- If invalid code passed, raise notice / error
      RAISE EXCEPTION 'INVALID_REFERRAL_CODE: The referral code % is not valid', p_referral_code;
    END IF;

    -- Self-referral protection
    IF v_sponsor_id = p_user_id THEN
      RAISE EXCEPTION 'SELF_REFERRAL_NOT_ALLOWED: You cannot use your own referral code';
    END IF;
  END IF;

  -- 3. Generate unique referral code for the new user
  v_new_ref_code := generate_unique_referral_code();

  -- 4. Insert new user record
  INSERT INTO public.users (
    id,
    name,
    phone,
    email,
    referral_code,
    referrer_id,
    referred_by,
    referred_by_user_id,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_name,
    p_phone,
    p_email,
    v_new_ref_code,
    v_sponsor_id,
    v_sponsor_code,
    v_sponsor_id,
    'active',
    NOW(),
    NOW()
  )
  RETURNING * INTO v_user_record;

  -- 5. If sponsor exists, increment sponsor referral count & create notification
  IF v_sponsor_id IS NOT NULL THEN
    UPDATE public.users 
    SET referral_count = COALESCE(referral_count, 0) + 1,
        updated_at = NOW()
    WHERE id = v_sponsor_id;

    INSERT INTO public.notifications (
      id,
      user_id,
      type,
      title,
      message,
      related_user_id,
      created_at
    ) VALUES (
      'notif_' || gen_random_uuid()::text,
      v_sponsor_id,
      'new_direct_referral',
      '🎉 नया डायरेक्ट रेफरल!',
      p_name || ' आपके रेफरल लिंक से जुड़ गए हैं।',
      p_user_id,
      NOW()
    );
  END IF;

  RETURN to_jsonb(v_user_record);
END;
$$;

-- 6. DIRECT REFERRALS RPC
CREATE OR REPLACE FUNCTION get_direct_referrals(p_user_id TEXT)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  phone TEXT,
  referral_code TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    u.id,
    u.name,
    CASE 
      WHEN LENGTH(u.phone) >= 10 THEN CONCAT(SUBSTRING(u.phone FROM 1 FOR 3), '****', SUBSTRING(u.phone FROM 8))
      ELSE u.phone
    END as phone,
    u.referral_code,
    u.status,
    u.created_at
  FROM public.users u
  WHERE u.referrer_id = p_user_id
  ORDER BY u.created_at DESC;
$$;

-- 7. DIRECT REFERRAL COUNT RPC
CREATE OR REPLACE FUNCTION get_direct_referral_count(p_user_id TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.users
  WHERE referrer_id = p_user_id;
$$;

-- 8. RECURSIVE DOWNLINE TREE RPC (Unlimited Levels)
CREATE OR REPLACE FUNCTION get_downline_tree(p_user_id TEXT, p_max_depth INTEGER DEFAULT 10)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  referral_code TEXT,
  referrer_id TEXT,
  level INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE downline AS (
    -- Anchor: Direct referrals (Level 1)
    SELECT 
      u.id,
      u.name,
      u.referral_code,
      u.referrer_id,
      1 AS level,
      u.status,
      u.created_at
    FROM public.users u
    WHERE u.referrer_id = p_user_id

    UNION ALL

    -- Recursive member: Sub-referrals (Level 2..N)
    SELECT 
      child.id,
      child.name,
      child.referral_code,
      child.referrer_id,
      parent.level + 1 AS level,
      child.status,
      child.created_at
    FROM public.users child
    INNER JOIN downline parent ON child.referrer_id = parent.id
    WHERE parent.level < p_max_depth
  )
  SELECT 
    d.id,
    d.name,
    d.referral_code,
    d.referrer_id,
    d.level,
    d.status,
    d.created_at
  FROM downline d
  ORDER BY d.level ASC, d.created_at DESC;
END;
$$;

-- 9. COMMISSION INSERTION TRIGGER & NOTIFICATION HELPER
CREATE OR REPLACE FUNCTION on_referral_commission_added()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Credit wallet balance
  UPDATE public.users
  SET referral_balance = COALESCE(referral_balance, 0) + NEW.commission_amount,
      wallet_balance = COALESCE(wallet_balance, 0) + NEW.commission_amount,
      updated_at = NOW()
  WHERE id = NEW.sponsor_id;

  -- Create Notification
  INSERT INTO public.notifications (
    id,
    user_id,
    type,
    title,
    message,
    related_user_id,
    created_at
  ) VALUES (
    'notif_' || gen_random_uuid()::text,
    NEW.sponsor_id,
    'referral_commission',
    '💰 रेफरल कमीशन प्राप्त!',
    'आपको Level ' || NEW.level::text || ' से ₹' || NEW.commission_amount::text || ' रेफरल कमीशन मिला।',
    NEW.referred_user_id,
    NOW()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_referral_commission ON public.referral_commissions;
CREATE TRIGGER trg_referral_commission
AFTER INSERT ON public.referral_commissions
FOR EACH ROW
EXECUTE FUNCTION on_referral_commission_added();
