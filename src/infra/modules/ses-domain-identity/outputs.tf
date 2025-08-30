output "domain_identity_arn" {
  description = "ARN of the SES domain identity"
  value       = aws_ses_domain_identity.domain.arn
}

output "domain_name" {
  description = "Domain name of the SES identity"
  value       = aws_ses_domain_identity.domain.domain
}

output "verification_token" {
  description = "Verification token to add as TXT record in Cloudflare DNS"
  value       = aws_ses_domain_identity.domain.verification_token
}

output "verification_instructions" {
  description = "Instructions for manual DNS verification"
  value       = "Add TXT record in Cloudflare: Name='_amazonses.${var.domain}' Value='${aws_ses_domain_identity.domain.verification_token}'"
}