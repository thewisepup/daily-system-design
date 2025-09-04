# SES Domain Identity
resource "aws_ses_domain_identity" "domain" {
  domain = var.domain
}

# Note: Since you're using Cloudflare for DNS, you'll need to manually add this TXT record:
# Name: _amazonses.dailysystemdesign.com  
# Value: [output from verification_token below]
# The verification resource below will wait for you to add this record

# SES Domain Identity Verification
# This waits for the domain to be verified via manual DNS record addition
resource "aws_ses_domain_identity_verification" "domain_verification" {
  domain = aws_ses_domain_identity.domain.domain

  timeouts {
    create = "15m"
  }
}

# SES DKIM Signing
resource "aws_ses_domain_dkim" "domain_dkim" {
  domain = aws_ses_domain_identity.domain.domain
}

# Note: Since you're using Cloudflare for DNS, you'll need to manually add these CNAME records:
# For each DKIM token (there will be 3), add:
# Name: [token]._domainkey.dailysystemdesign.com
# Value: [token].dkim.amazonses.com

# Custom MAIL FROM Domain
resource "aws_ses_domain_mail_from" "mail_from" {
  domain           = aws_ses_domain_identity.domain.domain
  mail_from_domain = "${var.mail_from_subdomain}.${var.domain}"

  # Behavior on MX record failure
  # UseDefaultValue: Fall back to amazonses.com default
  # RejectMessage: Reject the message if MX record is missing/incorrect
  behavior_on_mx_failure = "UseDefaultValue"

  depends_on = [aws_ses_domain_identity_verification.domain_verification]
}

# Note: For MAIL FROM to work, you must manually add these DNS records in Cloudflare:
# 1. MX Record: Name='${var.mail_from_subdomain}' Value='feedback-smtp.${data.aws_region.current.name}.amazonses.com' Priority=10
# 2. SPF Record: Name='${var.mail_from_subdomain}' Value='"v=spf1 include:amazonses.com ~all"' (TXT record)

data "aws_region" "current" {}
