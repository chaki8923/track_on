-- プロフィールに日次チェック回数を追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS daily_check_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_check_date DATE DEFAULT CURRENT_DATE;

COMMENT ON COLUMN profiles.daily_check_count IS '今日実行したチェック回数';
COMMENT ON COLUMN profiles.last_check_date IS '最後にチェックを実行した日付（日付が変わったらリセット）';

-- インデックス追加（日付でのクエリ最適化）
CREATE INDEX IF NOT EXISTS idx_profiles_last_check_date ON profiles(last_check_date);
