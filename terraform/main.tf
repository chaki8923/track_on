terraform {
  required_version = ">= 1.0"
   
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# -----------------------------------------------------------
# 1. IAM Role & Policies
# -----------------------------------------------------------

# Lambda実行用IAMロール
resource "aws_iam_role" "lambda_scraper_role" {
  name = "competitive-watcher-scraper-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# CloudWatch Logs用ポリシー
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_scraper_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# -----------------------------------------------------------
# 2. Layer Deployment via S3 (Fix for 413 Entity Too Large)
# -----------------------------------------------------------

# バケット名の重複を防ぐためのランダム文字列生成
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# レイヤー一時保管用のS3バケット作成
resource "aws_s3_bucket" "lambda_layers" {
  bucket        = "lambda-layers-${random_string.bucket_suffix.result}"
  force_destroy = true # `terraform destroy`時に中身ごと削除可能にする
}

# S3へchromium.zipをアップロード
resource "aws_s3_object" "chromium_zip" {
  bucket = aws_s3_bucket.lambda_layers.id
  key    = "chromium.zip"
  source = "${path.module}/chromium.zip"
  etag   = filemd5("${path.module}/chromium.zip") # ファイル変更検知用
}

# S3上のzipを参照してLambda Layerを作成
resource "aws_lambda_layer_version" "chromium_layer" {
  layer_name = "chromium-layer"

  # S3経由にすることでアップロードサイズ制限を回避
  s3_bucket = aws_s3_bucket.lambda_layers.id
  s3_key    = aws_s3_object.chromium_zip.key

  # ソースコードが変更されたらレイヤーも更新する
  source_code_hash    = filebase64sha256("${path.module}/chromium.zip")
  compatible_runtimes = ["nodejs18.x", "nodejs20.x", "nodejs22.x"]
  description         = "@sparticuz/chromium layer"
}

# -----------------------------------------------------------
# 3. Lambda Function Code Packaging
# -----------------------------------------------------------

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda"
  output_path = "${path.module}/lambda_function.zip"

  # レイヤーで提供されるため、コードからは除外
  excludes = [
    "node_modules/@sparticuz/chromium"
  ]
}

# -----------------------------------------------------------
# 4. Lambda Function Definition
# -----------------------------------------------------------

resource "aws_lambda_function" "scraper" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "competitive-watcher-scraper"
  role             = aws_iam_role.lambda_scraper_role.arn
  handler          = "handler.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "nodejs22.x"
  timeout          = 120
  memory_size      = 3008

  # 作成したレイヤーを適用
  layers = [aws_lambda_layer_version.chromium_layer.arn]

  environment {
    variables = {
      NODE_ENV                = "production"
      R2_ACCOUNT_ID           = var.r2_account_id
      R2_ACCESS_KEY_ID        = var.r2_access_key_id
      R2_SECRET_ACCESS_KEY    = var.r2_secret_access_key
      R2_BUCKET_NAME          = var.r2_bucket_name
      R2_PUBLIC_URL           = var.r2_public_url
    }
  }
}

# -----------------------------------------------------------
# 5. Function URL & Logging
# -----------------------------------------------------------

resource "aws_lambda_function_url" "scraper_url" {
  function_name      = aws_lambda_function.scraper.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["POST"]
    allow_headers     = ["*"]
    max_age           = 86400
  }
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.scraper.function_name}"
  retention_in_days = 7
}