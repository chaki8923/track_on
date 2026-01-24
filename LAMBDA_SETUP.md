# AWS Lambda スクレイピング環境セットアップガイド

Vercel環境でサイトチェックを安定動作させるため、AWS Lambdaを使用してスクレイピングを実行します。

---

## 🎯 構成

```
Next.js App (Vercel)
    ↓ HTTPリクエスト
AWS Lambda (Python + Selenium + Chromium)
    ↓ レスポンス
Next.js App (HTML + スクリーンショット)
```

---

## 📋 前提条件

- ✅ AWSアカウント
- ✅ AWS CLI設定済み
- ✅ Terraform インストール済み

---

## 🚀 セットアップ手順

### ステップ1: Chromium Layerの準備

公開されているChromium Lambda Layerを使用します。

**東京リージョン (ap-northeast-1) のARN:**
```
arn:aws:lambda:ap-northeast-1:764866452798:layer:chrome-aws-lambda:31
```

他のリージョンの場合、以下から確認：
- https://github.com/shelfio/chrome-aws-lambda-layer

---

### ステップ2: Terraformでデプロイ

```bash
# Terraformディレクトリに移動
cd terraform

# 初期化
terraform init

# プランを確認
terraform plan

# デプロイ
terraform apply
```

**確認メッセージが表示されたら `yes` を入力**

デプロイ完了後、以下の情報が表示されます：
```
Outputs:

lambda_function_url = "https://xxxxxxxxxxxxx.lambda-url.ap-northeast-1.on.aws/"
```

このURLをメモしてください。

---

### ステップ3: Vercelに環境変数を追加

1. **Vercelダッシュボード**を開く
2. プロジェクト → **Settings** → **Environment Variables**
3. 以下を追加：

| Name | Value |
|------|-------|
| `LAMBDA_SCRAPER_URL` | `https://xxxxxxxxxxxxx.lambda-url.ap-northeast-1.on.aws/` |

**Environment**: `Production`, `Preview`, `Development` すべてにチェック

---

### ステップ4: Vercelに再デプロイ

```bash
# Gitにコミット
git add .
git commit -m "feat: add Lambda scraper"
git push
```

または、Vercelダッシュボードで **Deployments** → **Redeploy** をクリック

---

## 🧪 動作確認

1. ダッシュボードでサイトチェックを実行
2. Vercelのログで以下が表示されることを確認：
   ```
   🚀 Using AWS Lambda for scraping
   📡 Lambda呼び出し: https://...
   ```
3. 成功すれば、変更検知結果が表示されます

---

## 📊 コスト試算

### AWS Lambdaの料金

**無料枠（12ヶ月間）:**
- 100万リクエスト/月
- 400,000 GB-秒のコンピューティング時間

**無料枠後:**
- $0.20 / 100万リクエスト
- $0.0000166667 / GB-秒

**例: 月1万リクエスト（300サイト×毎日）の場合:**
- リクエスト料金: $0.002
- 実行時間料金: 約$1-2
- **合計: 約$2-3/月**

---

## 🔍 トラブルシューティング

### エラー: `LAMBDA_SCRAPER_URL環境変数が設定されていません`

**対処**: Vercelの環境変数に`LAMBDA_SCRAPER_URL`を追加し、再デプロイ

### エラー: `Lambda error: timeout`

**対処**: `terraform/main.tf`の`timeout`を増やす
```hcl
timeout = 180  # 120 → 180秒
```
その後、`terraform apply`で更新

### エラー: `Lambda error: Task timed out`

**対処**: メモリを増やす
```hcl
memory_size = 3008  # 2048 → 3008MB
```

### Chromium Layerが見つからない

**対処**: リージョンに合ったARNを`terraform/variables.tf`で設定
```hcl
# 例: us-east-1の場合
default = "arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:31"
```

---

## 📁 ファイル構成

```
CompetitiveWatcher/
├── lambda/
│   ├── handler.py           # Lambda関数のメインコード
│   └── requirements.txt     # Python依存パッケージ
├── terraform/
│   ├── main.tf             # メインのTerraform設定
│   ├── variables.tf        # 変数定義
│   └── outputs.tf          # 出力定義
└── lib/
    └── scraper.ts          # スクレイパー（Lambda呼び出し）
```

---

## 🔧 カスタマイズ

### リージョン変更

`terraform/variables.tf`:
```hcl
variable "aws_region" {
  default = "us-east-1"  # 任意のリージョン
}
```

### タイムアウト変更

`terraform/main.tf`:
```hcl
timeout = 180  # 秒数を変更
```

### メモリ変更

`terraform/main.tf`:
```hcl
memory_size = 3008  # MB単位で変更
```

---

## 🗑️ 削除方法

Lambda環境が不要になった場合：

```bash
cd terraform
terraform destroy
```

**注意**: すべてのリソースが削除されます。

---

## 💡 Tips

### ログ確認

AWS CloudWatch Logsでログを確認：
1. AWSコンソール → **CloudWatch** → **Logs**
2. `/aws/lambda/competitive-watcher-scraper` を開く
3. 最新のログストリームを確認

### パフォーマンス最適化

- **メモリ**: 2048MBで十分（スクショなしなら1536MBでも可）
- **タイムアウト**: 通常は60-90秒で完了
- **同時実行**: デフォルトで1000まで対応

---

これで、Vercel環境でも安定してサイトチェックが動作します！🎉
