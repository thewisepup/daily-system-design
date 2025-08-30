# S3 Bucket outputs
output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = module.s3_bucket.bucket_name
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = module.s3_bucket.bucket_arn
}

# SES outputs
output "ses_admin_email_arn" {
  description = "ARN of the SES admin email identity"
  value       = module.ses_admin_email.admin_email_identity_arn
}

output "ses_admin_email_address" {
  description = "Admin email address configured in SES"
  value       = module.ses_admin_email.admin_email_address
}

# IAM User outputs
output "nextjs_iam_user_name" {
  description = "Name of the IAM user for Next.js application"
  value       = module.iam_nextjs_user.iam_user_name
}

output "nextjs_aws_access_key_id" {
  description = "AWS Access Key ID for Next.js application"
  value       = module.iam_nextjs_user.access_key_id
}

output "nextjs_aws_secret_access_key" {
  description = "AWS Secret Access Key for Next.js application (sensitive)"
  value       = module.iam_nextjs_user.secret_access_key
  sensitive   = true
}