-- Gamification: Achievement Badges & User Stats
-- Tracks user achievements and cached stats for efficient badge checking

-- Badge awards per user
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  badge_key TEXT NOT NULL,
  badge_tier TEXT NOT NULL DEFAULT 'bronze',
  earned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, badge_key, badge_tier)
);

-- Cached stats used for badge threshold checks
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  payrolls_completed INTEGER DEFAULT 0,
  early_completions INTEGER DEFAULT 0,
  steps_completed INTEGER DEFAULT 0,
  early_steps INTEGER DEFAULT 0,
  current_streak_weeks INTEGER DEFAULT 0,
  longest_streak_weeks INTEGER DEFAULT 0,
  perfect_months INTEGER DEFAULT 0,
  consecutive_perfect_months INTEGER DEFAULT 0,
  zero_overdue_months INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_tenant ON user_badges(tenant_id);
CREATE INDEX idx_user_stats_user ON user_stats(user_id);
CREATE INDEX idx_user_stats_tenant ON user_stats(tenant_id);

-- RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant badges" ON user_badges
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert own tenant badges" ON user_badges
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can view own tenant stats" ON user_stats
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage own tenant stats" ON user_stats
  FOR ALL USING (tenant_id = get_user_tenant_id());
