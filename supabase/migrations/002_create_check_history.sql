-- チェック履歴テーブル（変更あり・なし両方を記録）
CREATE TABLE IF NOT EXISTS site_check_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES monitored_sites(id) ON DELETE CASCADE NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- チェック結果
  has_changes BOOLEAN NOT NULL,
  check_duration_ms INTEGER, -- チェック時間（ミリ秒）
  
  -- 変更がある場合の情報
  change_id UUID REFERENCES site_changes(id) ON DELETE SET NULL,
  importance TEXT CHECK (importance IN ('high', 'medium', 'low')),
  changes_count INTEGER DEFAULT 0,
  
  -- AI要約（変更がある場合のみ）
  ai_summary TEXT,
  ai_intent TEXT,
  
  -- スクリーンショット（Cloudflare R2のURL）
  screenshot_url TEXT,
  screenshot_before_url TEXT,
  
  -- エラー情報
  has_error BOOLEAN DEFAULT false,
  error_message TEXT,
  
  -- インデックス用
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_check_history_site_id ON site_check_history(site_id);
CREATE INDEX IF NOT EXISTS idx_check_history_checked_at ON site_check_history(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_check_history_has_changes ON site_check_history(has_changes);

-- RLS ポリシー
ALTER TABLE site_check_history ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のサイトの履歴のみ閲覧可能
CREATE POLICY "Users can view check history of own sites"
  ON site_check_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM monitored_sites
      WHERE monitored_sites.id = site_check_history.site_id
      AND monitored_sites.user_id = auth.uid()
    )
  );

-- ユーザーは自分のサイトの履歴を作成可能
CREATE POLICY "Users can insert check history for own sites"
  ON site_check_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM monitored_sites
      WHERE monitored_sites.id = site_check_history.site_id
      AND monitored_sites.user_id = auth.uid()
    )
  );

-- 統計用のビュー（オプション）
CREATE OR REPLACE VIEW site_check_stats AS
SELECT 
  site_id,
  COUNT(*) as total_checks,
  COUNT(*) FILTER (WHERE has_changes = true) as changes_detected,
  COUNT(*) FILTER (WHERE has_error = true) as errors,
  AVG(check_duration_ms) as avg_duration_ms,
  MAX(checked_at) as last_checked_at
FROM site_check_history
GROUP BY site_id;
