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

output "dkim_tokens" {
  description = "DKIM tokens for DNS CNAME records"
  value       = aws_ses_domain_dkim.domain_dkim.dkim_tokens
}

output "dkim_instructions" {
  description = "Instructions for DKIM DNS setup"
  value       = "Add 3 CNAME records in Cloudflare for each token: Name='[token]._domainkey.${var.domain}' Value='[token].dkim.amazonses.com'"
}

# MAIL FROM Domain Outputs
output "mail_from_domain" {
  description = "Custom MAIL FROM domain"
  value       = aws_ses_domain_mail_from.mail_from.mail_from_domain
}

output "mail_from_mx_record" {
  description = "MX record value for custom MAIL FROM domain"
  value       = "feedback-smtp.${data.aws_region.current.name}.amazonses.com"
}

output "mail_from_spf_record" {
  description = "SPF record value for custom MAIL FROM domain"
  value       = "v=spf1 include:amazonses.com ~all"
}

output "mail_from_dns_instructions" {
  description = "Complete DNS instructions for MAIL FROM setup in Cloudflare"
  value = <<-EOT
    Add these DNS records in Cloudflare for MAIL FROM domain '${aws_ses_domain_mail_from.mail_from.mail_from_domain}':
    
    1. MX Record:
       - Name: ${var.mail_from_subdomain}
       - Value: feedback-smtp.${data.aws_region.current.name}.amazonses.com
       - Priority: 10
       
    2. TXT Record (SPF):
       - Name: ${var.mail_from_subdomain}
       - Value: "v=spf1 include:amazonses.com ~all"
    
    Note: DNS propagation may take up to 72 hours to complete.
  EOT
}