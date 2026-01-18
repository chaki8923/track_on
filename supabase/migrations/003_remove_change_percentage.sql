-- change_percentage カラムを削除（既に削除済みの場合はエラーを無視）
ALTER TABLE site_check_history DROP COLUMN IF EXISTS change_percentage;
