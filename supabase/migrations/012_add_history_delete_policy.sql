-- site_check_historyの削除を許可するRLSポリシーを追加
-- ユーザーは自分の監視サイトの履歴のみ削除可能

CREATE POLICY "Users can delete their own site check history" ON site_check_history FOR DELETE
USING (
  site_id IN (
    SELECT id FROM monitored_sites WHERE user_id = auth.uid()
  )
);
