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

output "ses_domain_identity_arn" {
  description = "ARN of the SES domain identity"
  value       = module.ses_domain_identity.domain_identity_arn
}

output "ses_domain_name" {
  description = "Domain name of the SES identity"
  value       = module.ses_domain_identity.domain_name
}

output "ses_verification_token" {
  description = "Verification token to add as TXT record in DNS"
  value       = module.ses_domain_identity.verification_token
}

output "ses_verification_instructions" {
  description = "Instructions for DNS verification"
  value       = module.ses_domain_identity.verification_instructions
}

output "ses_dkim_tokens" {
  description = "DKIM tokens for DNS CNAME records"
  value       = module.ses_domain_identity.dkim_tokens
}

output "ses_dkim_instructions" {
  description = "Instructions for DKIM DNS setup"
  value       = module.ses_domain_identity.dkim_instructions
}

# MAIL FROM Domain outputs
output "ses_mail_from_domain" {
  description = "Custom MAIL FROM domain"
  value       = module.ses_domain_identity.mail_from_domain
}

output "ses_mail_from_mx_record" {
  description = "MX record value for custom MAIL FROM domain"
  value       = module.ses_domain_identity.mail_from_mx_record
}

output "ses_mail_from_spf_record" {
  description = "SPF record value for custom MAIL FROM domain"
  value       = module.ses_domain_identity.mail_from_spf_record
}

output "ses_mail_from_dns_instructions" {
  description = "Complete DNS instructions for MAIL FROM setup in Cloudflare"
  value       = module.ses_domain_identity.mail_from_dns_instructions
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