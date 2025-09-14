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

# VDM (Virtual Deliverability Manager) outputs
output "vdm_account_enabled" {
  description = "Whether VDM is enabled at account level"
  value       = module.ses_vdm.vdm_account_enabled
}

output "vdm_dashboard_engagement_metrics_enabled" {
  description = "Whether VDM Dashboard engagement metrics are enabled"
  value       = module.ses_vdm.dashboard_engagement_metrics_enabled
}

output "vdm_guardian_optimized_shared_delivery_enabled" {
  description = "Whether VDM Guardian optimized shared delivery is enabled"
  value       = module.ses_vdm.guardian_optimized_shared_delivery_enabled
}

output "ses_newsletter_configuration_set_name" {
  description = "Name of the newsletter SES configuration set with VDM engagement metrics"
  value       = module.ses_vdm.newsletter_configuration_set_name
}

output "ses_newsletter_configuration_set_arn" {
  description = "ARN of the newsletter SES configuration set"
  value       = module.ses_vdm.newsletter_configuration_set_arn
}

output "ses_transactional_configuration_set_name" {
  description = "Name of the transactional SES configuration set with VDM engagement metrics for welcome emails and other transactional emails"
  value       = module.ses_vdm.transactional_configuration_set_name
}

output "ses_transactional_configuration_set_arn" {
  description = "ARN of the transactional SES configuration set"
  value       = module.ses_vdm.transactional_configuration_set_arn
}

# SES Event Tracking outputs
output "sns_ses_bounce_topic_arn" {
  description = "ARN of the SNS topic for SES bounce notifications"
  value       = module.ses_bounce_sns_topic.topic_arn
}

output "sns_ses_bounce_topic_name" {
  description = "Name of the SNS topic for SES bounce notifications"
  value       = module.ses_bounce_sns_topic.topic_name
}

output "ses_bounce_webhook_subscription_arn" {
  description = "ARN of the SNS subscription for SES bounce webhook"
  value       = module.ses_bounce_webhook_subscription.subscription_arn
}

output "ses_bounce_webhook_dlq_arn" {
  description = "ARN of the dead letter queue for failed webhook deliveries"
  value       = module.ses_bounce_webhook_subscription.dlq_arn
}

output "ses_bounce_webhook_dlq_url" {
  description = "URL of the dead letter queue for failed webhook deliveries"
  value       = module.ses_bounce_webhook_subscription.dlq_url
}
