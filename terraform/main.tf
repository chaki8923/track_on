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
  }
}

provider "aws" {
  region = var.aws_region
}

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

# Lambda Layer（Chromium + ChromeDriver）
# 公開されているレイヤーARNを直接使用するため、リソース作成は不要

# Lambda関数のソースコードをZIP化
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda"
  output_path = "${path.module}/lambda_function.zip"
}

# Lambda関数
resource "aws_lambda_function" "scraper" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "competitive-watcher-scraper"
  role            = aws_iam_role.lambda_scraper_role.arn
  handler         = "handler.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.11"
  timeout         = 120
  memory_size     = 2048

  layers = [
    # 公開されているChrome/ChromeDriverレイヤーを使用
    # リージョンに応じて変更してください
    # 例: us-east-1の場合
    # "arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:31"
    var.chrome_layer_arn
  ]

  environment {
    variables = {
      NODE_ENV = "production"
    }
  }
}

# Lambda Function URL（API Gateway不要で直接アクセス可能）
resource "aws_lambda_function_url" "scraper_url" {
  function_name      = aws_lambda_function.scraper.function_name
  authorization_type = "NONE"  # 認証はアプリケーション側で実施

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["POST"]
    allow_headers     = ["*"]
    max_age          = 86400
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.scraper.function_name}"
  retention_in_days = 7
}
