variable "aws_region" {
  description = "AWS region for Lambda function"
  type        = string
  default     = "ap-northeast-1"  # 東京リージョン
}

variable "chrome_layer_arn" {
  description = "ARN of the Chrome/ChromeDriver Lambda Layer"
  type        = string
  # リージョンごとに異なるARNを使用
  # 東京リージョン (ap-northeast-1) の例:
  default     = "arn:aws:lambda:ap-northeast-1:764866452798:layer:chrome-aws-lambda:31"
}
