output "lambda_function_url" {
  description = "Lambda Function URL (Next.jsアプリから呼び出すエンドポイント)"
  value       = aws_lambda_function_url.scraper_url.function_url
}

output "lambda_function_name" {
  description = "Lambda Function Name"
  value       = aws_lambda_function.scraper.function_name
}

output "lambda_function_arn" {
  description = "Lambda Function ARN"
  value       = aws_lambda_function.scraper.arn
}
