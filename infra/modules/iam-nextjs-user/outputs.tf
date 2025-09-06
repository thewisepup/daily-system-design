output "iam_user_name" {
  description = "Name of the IAM user"
  value       = aws_iam_user.nextjs_user.name
}

output "iam_user_arn" {
  description = "ARN of the IAM user"
  value       = aws_iam_user.nextjs_user.arn
}

output "access_key_id" {
  description = "AWS access key ID for the IAM user"
  value       = aws_iam_access_key.nextjs_access_key.id
}

output "secret_access_key" {
  description = "AWS secret access key for the IAM user"
  value       = aws_iam_access_key.nextjs_access_key.secret
  sensitive   = true
}

output "ses_policy_arn" {
  description = "ARN of the SES sending policy"
  value       = aws_iam_policy.ses_send_policy.arn
}