# GitHub Secrets 設定ガイド

## 🔐 必要なシークレット

GitHub Actionsの定期実行（Cron）を動作させるために、以下のシークレットを設定する必要があります。

---

## 📝 設定手順

### 1. GitHubリポジトリにアクセス

1. GitHubでリポジトリを開く
2. **Settings** タブをクリック
3. 左サイドバーから **Secrets and variables** > **Actions** をクリック

### 2. シークレットを追加

**「New repository secret」** ボタンをクリックして、以下の2つを追加します。

---

## 🔑 シークレット一覧

### **1. APP_URL**

- **Name**: `APP_URL`
- **Value**: あなたのVercelデプロイURL（本番環境）
  
**例:**
```
https://your-app-name.vercel.app
```

**⚠️ 注意:**
- `https://` を含める
- 末尾の `/` は**不要**
- Vercelの本番URLを使用（プレビューURLではない）

**Vercel URLの確認方法:**
1. Vercel Dashboard を開く
2. プロジェクトを選択
3. **Domains** セクションで本番URLを確認
4. または **Settings** > **Domains** から確認

---

### **2. SUPABASE_SERVICE_ROLE_KEY**

- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: SupabaseのService Role Key

**例:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0b296ZHB1b2hhbW9kaXFzcmVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk4NDQ3NiwiZXhwIjoyMDgzNTYwNDc2fQ.Itf634hoOjTUaiLjAH2c7kh2axrdjJyBvgLonQC0ETw
```

**⚠️ 注意:**
- `Bearer ` プレフィックスは**不要**（ワークフロー内で自動追加）
- このキーは**絶対に公開しない**こと

**Supabase Service Role Keyの確認方法:**
1. Supabase Dashboard を開く
2. プロジェクトを選択
3. **Settings** > **API** をクリック
4. **Project API keys** セクションで `service_role` キーをコピー

---

## ✅ 設定完了後の確認

### 1. **手動実行でテスト**

GitHubリポジトリで:

1. **Actions** タブを開く
2. 左サイドバーから **"Daily Site Check"** を選択
3. 右上の **"Run workflow"** をクリック
4. **"Run workflow"** ボタンをクリックして実行

### 2. **実行ログを確認**

ワークフローが正常に実行されると、以下のログが表示されます:

```
🚀 Starting daily check at Mon Jan 23 00:00:00 UTC 2026
📡 Calling: https://your-app.vercel.app/api/cron/daily-check
📊 HTTP Status: 200
📄 Response: {"success":true,"checkedCount":5,...}
✅ Daily check completed successfully
```

### 3. **エラーの場合**

以下のようなエラーが出る場合、シークレットが正しく設定されていません:

```
❌ Daily check failed with status 401
Response body: {"error":"Unauthorized"}
```

**対処法:**
- `SUPABASE_SERVICE_ROLE_KEY` が正しいか確認
- Vercel環境変数 `SUPABASE_SERVICE_ROLE_KEY` も設定されているか確認

---

## 🔄 Cronスケジュール

現在の設定: **毎日 00:00 UTC (日本時間 09:00)**

変更したい場合は `.github/workflows/cron.yml` を編集:

```yaml
schedule:
  # 毎日 00:00 UTC (09:00 JST)
  - cron: '0 0 * * *'
```

**Cron構文:**
```
* * * * *
│ │ │ │ │
│ │ │ │ └─ 曜日 (0-6, 0=日曜)
│ │ │ └─── 月 (1-12)
│ │ └───── 日 (1-31)
│ └─────── 時 (0-23, UTC)
└───────── 分 (0-59)
```

**例:**
- `0 0 * * *` - 毎日 00:00 UTC (09:00 JST)
- `0 12 * * *` - 毎日 12:00 UTC (21:00 JST)
- `0 */6 * * *` - 6時間ごと

---

## 🚨 トラブルシューティング

### **問題1: ワークフローが実行されない**

**原因:**
- GitHubリポジトリが **Public** で、最近のコミットがない場合、Cronが自動停止する

**対処法:**
1. リポジトリを **Private** にする（推奨）
2. または定期的にコミットを行う

---

### **問題2: 401 Unauthorized エラー**

**原因:**
- `SUPABASE_SERVICE_ROLE_KEY` が設定されていない
- または間違っている

**対処法:**
1. GitHubシークレットを確認
2. Vercel環境変数 `SUPABASE_SERVICE_ROLE_KEY` も確認
3. Supabase Dashboardから正しいキーをコピーして再設定

---

### **問題3: 404 Not Found エラー**

**原因:**
- `APP_URL` が間違っている
- API エンドポイントがデプロイされていない

**対処法:**
1. `APP_URL` が正しいVercel URLか確認
2. `/api/cron/daily-check` エンドポイントがデプロイされているか確認
3. ブラウザで `https://your-app.vercel.app/api/cron/daily-check` にアクセスして確認

---

### **問題4: 500 Internal Server Error**

**原因:**
- Vercel環境変数が不足している
- データベース接続エラー

**対処法:**
1. Vercelの環境変数を確認:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - その他必要な環境変数
2. Vercelのログを確認

---

## 📧 通知設定

### GitHubからのメール通知を停止する場合

1. リポジトリの **Settings** > **Notifications** から設定
2. または GitHub個人設定で **Notifications** を調整

### Cronの結果を自分で確認する場合

1. **Actions** タブで履歴を確認
2. または Vercel Logs で `/api/cron/daily-check` のログを確認

---

## 📚 参考リンク

- [GitHub Actions - Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Actions - Cron Schedule](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase API Keys](https://supabase.com/docs/guides/api#api-keys)

---

## ✨ 完了！

設定完了後、毎日自動的にサイトチェックが実行されます。

手動実行でテストして、正常に動作することを確認してください！🎉
