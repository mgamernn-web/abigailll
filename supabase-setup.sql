-- ═══════════════════════════════════════════════════════════════
-- Abigail Bot — Complete Supabase Setup
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run ALL
-- ═══════════════════════════════════════════════════════════════

-- 1. AFK Users
CREATE TABLE IF NOT EXISTS afk_users (
  user_id    TEXT NOT NULL,
  guild_id   TEXT NOT NULL,
  afk_time   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason     TEXT DEFAULT 'Just stepped away for a moment 💫',
  avatar_url TEXT,
  username   TEXT,
  PRIMARY KEY (user_id, guild_id)
);

-- 2. Wallets (Economy)
CREATE TABLE IF NOT EXISTS wallets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  username TEXT DEFAULT '',
  balance BIGINT DEFAULT 0,
  bank BIGINT DEFAULT 0,
  last_daily TIMESTAMPTZ,
  last_work TIMESTAMPTZ,
  last_beg TIMESTAMPTZ,
  last_rob TIMESTAMPTZ,
  last_gamble TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, guild_id)
);

-- 3. Server Pools
CREATE TABLE IF NOT EXISTS server_pools (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  guild_id TEXT NOT NULL UNIQUE,
  guild_name TEXT DEFAULT '',
  balance BIGINT DEFAULT 0,
  total_donated BIGINT DEFAULT 0,
  donor_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Pool Donors
CREATE TABLE IF NOT EXISTS pool_donors (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  username TEXT DEFAULT '',
  total_donated BIGINT DEFAULT 0,
  donation_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, guild_id)
);

-- 5. Mimic Access
CREATE TABLE IF NOT EXISTS mimic_access (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  username TEXT DEFAULT '',
  granted_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, guild_id)
);

-- 6. Mimic Log Access
CREATE TABLE IF NOT EXISTS mimic_log_access (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  username TEXT DEFAULT '',
  granted_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, guild_id)
);

-- 7. Mimic Protected
CREATE TABLE IF NOT EXISTS mimic_protected (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  username TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, guild_id)
);

-- 8. Mimic Log Channel
CREATE TABLE IF NOT EXISTS mimic_log_channel (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  guild_id TEXT NOT NULL UNIQUE,
  channel_id TEXT NOT NULL,
  channel_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AFK Break Access
CREATE TABLE IF NOT EXISTS afk_break_access (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  allowed_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, guild_id)
);

-- 10. AFK Break Access Config
CREATE TABLE IF NOT EXISTS afk_break_access_config (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  guild_id TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT false,
  allowed_role_id TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AFK Break Protected
CREATE TABLE IF NOT EXISTS afk_break_protected (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  username TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, guild_id)
);

-- 12. Lootbox Config
CREATE TABLE IF NOT EXISTS lootbox_config (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  guild_id TEXT NOT NULL UNIQUE,
  guild_name TEXT DEFAULT '',
  enabled BOOLEAN DEFAULT false,
  channel_id TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Hand Cricket Profiles
CREATE TABLE IF NOT EXISTS hc_profiles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  username TEXT DEFAULT '',
  games_played INT DEFAULT 0,
  games_won INT DEFAULT 0,
  total_runs INT DEFAULT 0,
  total_wickets INT DEFAULT 0,
  highest_score INT DEFAULT 0,
  total_balls INT DEFAULT 0,
  total_fours INT DEFAULT 0,
  total_sixes INT DEFAULT 0,
  win_streak INT DEFAULT 0,
  best_win_streak INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Hand Cricket Match History
CREATE TABLE IF NOT EXISTS hc_match_history (
  match_id TEXT NOT NULL PRIMARY KEY,
  players JSONB DEFAULT '[]',
  scores JSONB DEFAULT '{}',
  winner TEXT,
  overs INTEGER DEFAULT 1,
  wickets INTEGER DEFAULT 2,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  catch_chances INTEGER DEFAULT 0,
  catches_taken INTEGER DEFAULT 0,
  catches_dropped INTEGER DEFAULT 0,
  milestones JSONB DEFAULT '[]'
);

-- 15. Chat Leaderboard
CREATE TABLE IF NOT EXISTS chat_leaderboard (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  username TEXT DEFAULT '',
  message_count BIGINT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, guild_id)
);

-- 16. Trusted Users
CREATE TABLE IF NOT EXISTS trusted_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  added_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, guild_id)
);

-- ═══════════════════════════════════════════════════════════════
-- Disable RLS on ALL tables
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE afk_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE server_pools DISABLE ROW LEVEL SECURITY;
ALTER TABLE pool_donors DISABLE ROW LEVEL SECURITY;
ALTER TABLE mimic_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE mimic_log_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE mimic_protected DISABLE ROW LEVEL SECURITY;
ALTER TABLE mimic_log_channel DISABLE ROW LEVEL SECURITY;
ALTER TABLE afk_break_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE afk_break_access_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE afk_break_protected DISABLE ROW LEVEL SECURITY;
ALTER TABLE lootbox_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE hc_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE hc_match_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_leaderboard DISABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_users DISABLE ROW LEVEL SECURITY;
