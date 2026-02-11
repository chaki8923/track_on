-- ============================================
-- profilesテーブル以外のデータを全て削除
-- ============================================
-- 注意: このクエリは取り消せません！
-- 実行前に必ずバックアップを取ってください
-- ============================================

-- 外部キー制約を考慮して順番に削除

-- 1. フィードバック関連
-- TRUNCATE TABLE user_feedback CASCADE;

-- 2. 通知関連
TRUNCATE TABLE notifications CASCADE;

-- 3. サイトチェック履歴（site_check_historyは最後）
TRUNCATE TABLE site_check_history CASCADE;

-- 4. サイト変更履歴
TRUNCATE TABLE site_changes CASCADE;

-- 5. サイトスナップショット
TRUNCATE TABLE site_snapshots CASCADE;

-- 6. 監視サイト（外部キーの親テーブル）
TRUNCATE TABLE monitored_sites CASCADE;

-- 7. 通知設定（profilesに紐づく）
TRUNCATE TABLE notification_settings CASCADE;

-- 実行結果を確認
SELECT 'user_feedback' as table_name, COUNT(*) as remaining_rows FROM user_feedback
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'site_check_history', COUNT(*) FROM site_check_history
UNION ALL
SELECT 'site_changes', COUNT(*) FROM site_changes
UNION ALL
SELECT 'site_snapshots', COUNT(*) FROM site_snapshots
UNION ALL
SELECT 'monitored_sites', COUNT(*) FROM monitored_sites
UNION ALL
SELECT 'notification_settings', COUNT(*) FROM notification_settings
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles;

-- ============================================
-- 実行後の確認事項:
-- 1. 全てのテーブルで remaining_rows = 0 になっているか確認（profiles以外）
-- 2. profilesテーブルのデータは残っているか確認
-- ============================================
