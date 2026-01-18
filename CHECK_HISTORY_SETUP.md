# チェック履歴機能のセットアップ

## 📋 概要

サイトチェックの履歴が保存されない場合、`site_check_history` テーブルが作成されていない可能性があります。

---

## ✅ 確認方法

### 1. Supabase Dashboard でテーブルを確認

1. [Supabase Dashboard](https://app.supabase.com/) にアクセス
2. あなたのプロジェクトを選択
3. 左メニューから **「Table Editor」** をクリック
4. **`site_check_history`** テーブルが存在するか確認

---

## 🔧 テーブルが存在しない場合の対処法

### 方法1: SQL Editor で直接実行（推奨）

1. Supabase Dashboard の左メニューから **「SQL Editor」** をクリック
2. **「New query」** をクリック
3. 以下のSQLをコピー&ペースト
4. **「Run」** をクリック

```sql
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
```

### 方法2: マイグレーションファイルを使用

すでにマイグレーションファイルが存在しています：
`supabase/migrations/002_create_check_history.sql`

Supabase CLI を使用してマイグレーションを実行できます：

```bash
# Supabase CLI がインストールされていない場合
npm install -g supabase

# プロジェクトにログイン
supabase login

# マイグレーションを実行
supabase db push
```

---

## 🧪 テーブル作成後の確認

### 1. Table Editor で確認

1. Supabase Dashboard の **「Table Editor」** で `site_check_history` テーブルを開く
2. カラムが正しく作成されているか確認

**必要なカラム**:
- `id` (UUID)
- `site_id` (UUID)
- `checked_at` (TIMESTAMP)
- `has_changes` (BOOLEAN)
- `check_duration_ms` (INTEGER)
- `change_id` (UUID, nullable)
- `importance` (TEXT, nullable)
- `changes_count` (INTEGER)
- `ai_summary` (TEXT, nullable)
- `ai_intent` (TEXT, nullable)
- `screenshot_url` (TEXT, nullable)
- `screenshot_before_url` (TEXT, nullable)
- `has_error` (BOOLEAN)
- `error_message` (TEXT, nullable)
- `created_at` (TIMESTAMP)

### 2. RLS ポリシーを確認

1. Supabase Dashboard の **「Authentication」** > **「Policies」** を開く
2. `site_check_history` テーブルに以下のポリシーが存在するか確認：
   - ✅ **「Users can view check history of own sites」** (SELECT)
   - ✅ **「Users can insert check history for own sites」** (INSERT)

---

## 🐛 デバッグ方法

### サイトチェック実行時のログを確認

1. サイトチェックを実行
2. ターミナル（開発サーバーを起動しているターミナル）のログを確認

**正常な場合のログ**:
```
✅ スクリーンショットをR2にアップロード: https://...
📸 前回のスクショを取得: https://...
💾 スナップショットを保存: ID=xxx, スクショURL=https://...
📝 履歴保存データ（変更あり/なし）: { ... }
✅ 履歴保存成功: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**エラーがある場合のログ**:
```
❌ 履歴保存エラー: { ... }
```

エラーメッセージから原因を特定できます。

### よくあるエラーと対処法

#### 1. `relation "site_check_history" does not exist`
**原因**: テーブルが作成されていない  
**対処**: 上記のSQLを実行してテーブルを作成

#### 2. `new row violates row-level security policy`
**原因**: RLSポリシーが正しく設定されていない  
**対処**: ポリシーを再作成（上記のSQLを実行）

#### 3. `null value in column "has_changes" violates not-null constraint`
**原因**: 必須カラムが欠けている  
**対処**: チェックAPIのコードを確認（`checkHistoryData` に `has_changes` が含まれているか）

---

## 📊 履歴データの確認

### SQL Editor でデータを確認

```sql
-- 最新の履歴10件を表示
SELECT 
  h.id,
  m.name as site_name,
  h.checked_at,
  h.has_changes,
  h.has_error,
  h.changes_count,
  h.importance,
  h.screenshot_url,
  h.screenshot_before_url
FROM site_check_history h
JOIN monitored_sites m ON m.id = h.site_id
ORDER BY h.checked_at DESC
LIMIT 10;
```

### 履歴ページでの確認

1. ダッシュボードの「履歴」リンクをクリック
2. 過去のチェック結果が表示されるか確認
3. スクリーンショットが表示されるか確認（R2設定が必要）

---

## 🎨 スクリーンショット比較機能

履歴ページでは、前回と今回のスクリーンショットを並べて比較できます：

```
┌──────────────────────────────────────────┐
│ 📸 スクリーンショット比較 [BEFORE/AFTER] │
├──────────────────────────────────────────┤
│  前回チェック [BEFORE]  │ 今回チェック [AFTER] │
│  🔴赤枠で表示          │ 🟢緑枠で表示        │
│  クリックで拡大        │ クリックで拡大      │
└──────────────────────────────────────────┘
```

**機能**:
- ✅ BEFORE/AFTERのラベル付き
- ✅ 色分けされた枠（赤/緑）
- ✅ クリックで拡大表示
- ✅ ホバー時のズームエフェクト

---

## 🚀 次のステップ

1. [ ] テーブルが存在するか確認
2. [ ] 存在しない場合はSQLを実行して作成
3. [ ] サイトチェックを実行
4. [ ] ターミナルのログを確認
5. [ ] 履歴ページでデータを確認
6. [ ] スクリーンショット比較が動作するか確認

---

## 💡 トラブルシューティング

### 履歴ページで「履歴がありません」と表示される

**原因1**: まだチェックを実行していない  
→ サイトチェックを実行してください

**原因2**: テーブルが存在しない  
→ 上記のSQLでテーブルを作成

**原因3**: RLSポリシーの問題  
→ ポリシーを再作成

### スクリーンショットが表示されない

**原因1**: R2が設定されていない  
→ `.env.local` にR2の設定を追加（`ENV_SETUP_GUIDE.md` 参照）

**原因2**: スクリーンショットのアップロードに失敗  
→ ターミナルのログで「スクリーンショットのアップロードに失敗」エラーを確認

**原因3**: screenshot_url が null  
→ SQL で確認: `SELECT screenshot_url FROM site_check_history WHERE screenshot_url IS NOT NULL;`

---

問題が解決しない場合は、ターミナルのログをすべてコピーして確認してください。
