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
