-- スクリーンショットURLカラムを追加（存在しない場合のみ）
-- screenshot_url カラムを追加
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'site_check_history' 
        AND column_name = 'screenshot_url'
    ) THEN
        ALTER TABLE site_check_history ADD COLUMN screenshot_url TEXT;
    END IF;
END $$;

-- screenshot_before_url カラムを追加
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'site_check_history' 
        AND column_name = 'screenshot_before_url'
    ) THEN
        ALTER TABLE site_check_history ADD COLUMN screenshot_before_url TEXT;
    END IF;
END $$;
