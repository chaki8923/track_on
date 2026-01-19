-- 比較対象のスナップショットの日時を保存するカラムを追加
ALTER TABLE site_check_history 
ADD COLUMN IF NOT EXISTS compared_snapshot_created_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN site_check_history.compared_snapshot_created_at IS '比較対象として使用されたスナップショットの作成日時（日付指定チェックの場合）';
