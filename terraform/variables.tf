variable "aws_region" {
  description = "AWS region for Lambda function"
  type        = string
  default     = "ap-northeast-1"  # 東京リージョン
}

variable "chrome_layer_arn" {
  description = "ARN of the Chromium Lambda Layer for @sparticuz/chromium"
  type        = string
  # @sparticuz/chromium用の公開レイヤー
  # 東京リージョン (ap-northeast-1):
  default     = "arn:aws:lambda:ap-northeast-1:041475135427:layer:chromium:1"
}

variable "r2_account_id" {
  description = "Cloudflare R2 Account ID"
  type        = string
  sensitive   = true
}

variable "r2_access_key_id" {
  description = "Cloudflare R2 Access Key ID"
  type        = string
  sensitive   = true
}

variable "r2_secret_access_key" {
  description = "Cloudflare R2 Secret Access Key"
  type        = string
  sensitive   = true
}

variable "r2_bucket_name" {
  description = "Cloudflare R2 Bucket Name"
  type        = string
}

variable "r2_public_url" {
  description = "Cloudflare R2 Public URL"
  type        = string
}
