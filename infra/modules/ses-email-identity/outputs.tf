output "admin_email_identity_arn" {
  description = "ARN of the SES admin email identity"
  value       = aws_ses_email_identity.admin_email_identity.arn
}

output "admin_email_address" {
  description = "Admin email address of the SES identity"
  value       = aws_ses_email_identity.admin_email_identity.email
}