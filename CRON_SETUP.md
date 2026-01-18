# 🕐 Cron（自動チェック）設定ガイド

毎日自動でサイトチェックを実行するための設定方法を説明します。

---

## 📋 概要

**GitHub Actions** を使用して、毎日午前9時（日本時間）に自動チェックを実行します。

**仕組み**:
```
GitHub Actions (毎日9時)
  ↓
あなたのアプリの /api/cron/daily-check を呼び出し
  ↓
すべてのアクティブなサイトをチェック
  ↓
変更があればメール/Slack通知
```

---

## ⚠️ 前提条件

1. ✅ アプリが本番環境にデプロイされている（Vercel等）
2. ✅ GitHubリポジトリが作成されている
3. ✅ コードがGitHubにプッシュされている

**注意**: ローカル環境 (`localhost`) はGitHub Actionsからアクセスできません！

---

## 🚀 セットアップ手順

### ステップ1: アプリを本番環境にデプロイ

まだデプロイしていない場合は、先にデプロイしてください。

#### Vercel の場合:
1. [Vercel](https://vercel.com/) にアクセス
2. GitHubリポジトリを接続
3. デプロイ
4. デプロイ後のURL（例: `https://your-app.vercel.app`）をメモ

#### その他のサービス:
- Netlify
- Railway
- Render
など、お好きなホスティングサービスを使用できます。

---

### ステップ2: GitHub Secretsを設定

GitHubリポジトリに環境変数（Secrets）を設定します。

#### 1. GitHubリポジトリのページを開く

例: `https://github.com/your-username/CompetitiveWatcher`

#### 2. Settings → Secrets and variables → Actions

1. 右上の **「Settings」** タブをクリック
2. 左メニューから **「Secrets and variables」** をクリック
3. **「Actions」** をクリック
4. **「New repository secret」** ボタンをクリック

#### 3. 以下の2つのシークレットを追加

---

##### **シークレット1: `SUPABASE_SERVICE_ROLE_KEY`**

| 項目 | 値 |
|------|-----|
| **Name** | `SUPABASE_SERVICE_ROLE_KEY` |
| **Secret** | Supabaseの `service_role` key |

**取得方法**:
1. [Supabase Dashboard](https://app.supabase.com/) にアクセス
2. プロジェクトを選択
3. 左メニューから **「Settings」** → **「API」** をクリック
4. **「Project API keys」** セクションを探す
5. **`service_role` `secret`** の値をコピー
6. GitHubのSecretに貼り付け

⚠️ **注意**: `anon` `public` ではなく、`service_role` `secret` を使用してください！

---

##### **シークレット2: `APP_URL`**

| 項目 | 値 |
|------|-----|
| **Name** | `APP_URL` |
| **Secret** | あなたのアプリのURL |

**例**:
- Vercel: `https://your-app.vercel.app`
- カスタムドメイン: `https://your-domain.com`

⚠️ **注意**: 
- `http://` または `https://` を含めてください
- 末尾のスラッシュ `/` は**不要**です
- ローカル環境のURL (`http://localhost:3000`) は使用できません

---

### ステップ3: 環境変数をVercelにも設定

Vercelのダッシュボードで環境変数を設定します。

1. Vercelプロジェクトのページを開く
2. **「Settings」** → **「Environment Variables」** をクリック
3. 以下を追加:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseの `service_role` key |

他の環境変数（Supabase URL、Gemini API Key等）も設定されているか確認してください。

---

### ステップ4: コードをGitHubにプッシュ

修正したコードをGitHubにプッシュします。

```bash
git add .
git commit -m "Fix cron setup"
git push origin main
```

---

### ステップ5: 動作確認

#### 手動実行でテスト

1. GitHubリポジトリのページを開く
2. **「Actions」** タブをクリック
3. 左側から **「Daily Site Check」** をクリック
4. 右上の **「Run workflow」** ボタンをクリック
5. **「Run workflow」** を再度クリック

数秒〜数分待って、ワークフローが成功するか確認します。

#### ログを確認

ワークフローの実行が完了したら、ログを確認します：

1. 実行されたワークフローをクリック
2. **「check-sites」** ジョブをクリック
3. **「Trigger Daily Check」** ステップを開く

**成功時のログ**:
```json
{
  "success": true,
  "checkedCount": 2,
  "results": [
    {
      "siteId": "...",
      "siteName": "Example Site",
      "success": true,
      "hasChanges": false
    }
  ],
  "timestamp": "2026-01-18T00:00:00.000Z"
}
```

**失敗時のログ**:
```
curl: (3) URL rejected: No host part in the URL
Error: Process completed with exit code 3.
```
→ `APP_URL` が設定されていない

```
{"error":"Unauthorized"}
```
→ `SUPABASE_SERVICE_ROLE_KEY` が正しくない

---

## 🕐 実行スケジュール

現在の設定: **毎日午前9時（日本時間）**

`.github/workflows/cron.yml`:
```yaml
schedule:
  # 毎日 00:00 UTC (09:00 JST)
  - cron: '0 0 * * *'
```

### スケジュールを変更する場合

**例1: 毎日午前6時（日本時間）**
```yaml
- cron: '0 21 * * *'  # 21:00 UTC = 06:00 JST
```

**例2: 毎日正午（日本時間）**
```yaml
- cron: '0 3 * * *'   # 03:00 UTC = 12:00 JST
```

**例3: 毎日午後6時（日本時間）**
```yaml
- cron: '0 9 * * *'   # 09:00 UTC = 18:00 JST
```

**Cron表記の説明**:
```
分 時 日 月 曜日
│ │ │ │ │
│ │ │ │ └─── 曜日 (0-7, 0と7は日曜日)
│ │ │ └───── 月 (1-12)
│ │ └─────── 日 (1-31)
│ └───────── 時 (0-23, UTC)
└─────────── 分 (0-59)

* = すべて
*/2 = 2つおき
```

---

## 🐛 トラブルシューティング

### エラー: `No host part in the URL`

**原因**: `APP_URL` が設定されていない

**対処**:
1. GitHubの Secrets に `APP_URL` を追加
2. 値: `https://your-app.vercel.app`（あなたのアプリのURL）

---

### エラー: `Unauthorized`

**原因**: `SUPABASE_SERVICE_ROLE_KEY` が正しくない

**対処**:
1. Supabase Dashboard で `service_role` key を再確認
2. GitHubの Secrets を更新
3. `anon` key ではなく `service_role` key を使用しているか確認

---

### エラー: `500 Internal Server Error`

**原因**: アプリ内のエラー

**対処**:
1. Vercelのログを確認
2. ターミナルで手動テスト:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  "https://your-app.vercel.app/api/cron/daily-check"
```

---

### ワークフローが実行されない

**原因**: GitHub Actionsが有効になっていない

**対処**:
1. リポジトリの **「Settings」** → **「Actions」** → **「General」**
2. **「Allow all actions and reusable workflows」** を選択
3. 保存

---

### メールが届かない

**原因**: 通知設定が有効になっていない

**対処**:
1. ダッシュボードの **「設定」** ページを開く
2. 通知設定を有効にする
3. メールアドレスまたはSlack Webhook URLを設定

---

## ✅ チェックリスト

セットアップ完了前に確認してください：

- [ ] アプリが本番環境にデプロイされている
- [ ] GitHubリポジトリが作成されている
- [ ] GitHub Secrets に `SUPABASE_SERVICE_ROLE_KEY` を追加した
- [ ] GitHub Secrets に `APP_URL` を追加した
- [ ] Vercel に環境変数を設定した
- [ ] コードをGitHubにプッシュした
- [ ] 手動実行でテストして成功した
- [ ] ログに `"success": true` が表示された

---

## 📧 通知設定

サイトに変更があった場合、自動で通知されます。

通知を有効にするには：
1. ダッシュボードの **「設定」** ページを開く
2. **「メール通知」** または **「Slack通知」** を有効にする
3. 保存

---

## 💡 Tips

### コスト削減

- Vercel Free プランでは、1日あたりの実行時間に制限があります
- 監視サイト数が多い場合は、実行頻度を調整してください

### レート制限

- 各サイトチェックの間に2秒の待機時間を入れています
- 外部サイトへの負荷を考慮した設計です

### デバッグ

手動でAPIを呼び出してテスト:
```bash
# ローカル環境
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  http://localhost:3000/api/cron/daily-check

# 本番環境
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  https://your-app.vercel.app/api/cron/daily-check
```

---

設定が完了したら、翌日の午前9時に自動チェックが実行されます！🎉
