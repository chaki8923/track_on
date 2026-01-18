-- ai_suggestions カラムを追加（推奨施策を履歴に保存）
ALTER TABLE site_check_history ADD COLUMN IF NOT EXISTS ai_suggestions TEXT;
