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
