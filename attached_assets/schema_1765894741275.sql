-- GeoLingua Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- USERS TABLE
-- =====================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'translator', 'admin')),
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =====================
-- TRANSLATOR PROFILES
-- =====================
CREATE TABLE translator_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  languages JSONB NOT NULL, -- [{from: 'ka', to: 'en'}, ...]
  categories TEXT[] NOT NULL, -- ['general', 'medical', 'legal']
  bio TEXT,
  location VARCHAR(255),
  price_modifier DECIMAL(3,2) DEFAULT 1.0, -- For premium translators
  total_calls INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  avg_rating DECIMAL(2,1) DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  push_token TEXT, -- For push notifications
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_translator_languages ON translator_profiles USING GIN (languages);
CREATE INDEX idx_translator_categories ON translator_profiles USING GIN (categories);

-- =====================
-- TRANSLATION REQUESTS
-- =====================
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  translator_id UUID REFERENCES users(id),
  from_lang VARCHAR(10) NOT NULL,
  to_lang VARCHAR(10) NOT NULL,
  category VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('instant', 'scheduled')),
  scheduled_time TIMESTAMPTZ,
  estimated_duration INTEGER, -- in minutes
  context TEXT,
  use_ai BOOLEAN DEFAULT FALSE,
  price_per_minute DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'connecting', 'in_call', 'completed', 'cancelled', 'expired'
  )),
  room_name VARCHAR(255),
  accepted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_requests_user ON requests(user_id);
CREATE INDEX idx_requests_translator ON requests(translator_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_languages ON requests(from_lang, to_lang);

-- =====================
-- CALLS
-- =====================
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  translator_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration INTEGER, -- in seconds
  total_price DECIMAL(10,2),
  translator_earnings DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_comment TEXT,
  translator_rating INTEGER CHECK (translator_rating >= 1 AND translator_rating <= 5),
  translator_comment TEXT,
  payout_status VARCHAR(20) DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calls_request ON calls(request_id);
CREATE INDEX idx_calls_translator ON calls(translator_id);
CREATE INDEX idx_calls_status ON calls(status);

-- =====================
-- PAYMENTS
-- =====================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  stripe_payment_intent_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'GEL',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_call ON payments(call_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- =====================
-- PAYOUTS (Translator Withdrawals)
-- =====================
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  translator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(50) NOT NULL, -- 'bank', 'paypal', 'wise'
  details JSONB, -- Account details
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX idx_payouts_translator ON payouts(translator_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE translator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Policies (basic - expand based on needs)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- =====================
-- FUNCTIONS
-- =====================

-- Update translator stats after call completion
CREATE OR REPLACE FUNCTION update_translator_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE translator_profiles
    SET 
      total_calls = total_calls + 1,
      total_minutes = total_minutes + CEIL(NEW.duration / 60.0),
      updated_at = NOW()
    WHERE user_id = NEW.translator_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_translator_stats
AFTER UPDATE ON calls
FOR EACH ROW
EXECUTE FUNCTION update_translator_stats();

-- Update average rating
CREATE OR REPLACE FUNCTION update_translator_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_rating IS NOT NULL THEN
    UPDATE translator_profiles
    SET 
      avg_rating = (
        SELECT AVG(user_rating)::DECIMAL(2,1)
        FROM calls
        WHERE translator_id = NEW.translator_id
        AND user_rating IS NOT NULL
      ),
      updated_at = NOW()
    WHERE user_id = NEW.translator_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_translator_rating
AFTER UPDATE ON calls
FOR EACH ROW
EXECUTE FUNCTION update_translator_rating();

-- =====================
-- SEED DATA (Languages & Categories)
-- =====================

-- This is handled in the API, but you can add default admin user here
-- INSERT INTO users (email, password, full_name, role) 
-- VALUES ('admin@geolingua.ge', 'hashed_password', 'Admin', 'admin');
