# AWS SES Implementation Plan for Daily System Design Newsletter

## Overview
This plan outlines the complete setup of AWS SES for sending newsletters, progressing from personal email testing to production deployment with custom domain (`dailysystemdesign.com`).

## Phase 1: Infrastructure as Code Setup

### 1. Create AWS SES Infrastructure as Code (IaC) Setup
- **Goal**: Set up AWS SES using Terraform or AWS CDK for reproducible infrastructure
- **Tasks**:
  - Choose IaC tool (Terraform recommended)
  - Create `infrastructure/` directory in project
  - Define SES email identity resources
  - Set up IAM roles and policies for SES access
  - Configure AWS credentials and region settings
- **Files to Create**:
  - `infrastructure/main.tf` (Terraform main configuration)
  - `infrastructure/ses.tf` (SES-specific resources)
  - `infrastructure/iam.tf` (IAM policies for SES)
  - `infrastructure/variables.tf` (Configuration variables)

## Phase 2: Personal Email Testing

### 2. Configure SES for Personal Email Testing
- **Goal**: Set up SES with personal email for initial testing
- **Tasks**:
  - Define personal email as verified identity in Terraform
  - Set SES to sandbox mode initially
  - Configure AWS region (us-east-1 recommended for SES)
  - Apply Terraform configuration

### 3. Verify Personal Email Address in AWS SES
- **Goal**: Complete email verification process
- **Tasks**:
  - Run `terraform apply` to create SES identity
  - Check personal email for verification link
  - Click verification link to activate email identity
  - Confirm verification status in AWS SES console

### 4. Update emailService.ts to Use Real AWS SES
- **Goal**: Replace mock AWS SES provider with actual SES integration
- **Tasks**:
  - Install required AWS SDK dependencies (`@aws-sdk/client-ses`)
  - Update `src/server/email/providers/awsSes.ts` with real SES client
  - Configure AWS credentials via environment variables
  - Remove mock responses and implement actual SES sending
  - Add proper error handling for SES-specific errors
- **Environment Variables to Add**:
  ```bash
  AWS_REGION=us-east-1
  AWS_ACCESS_KEY_ID=your-access-key
  AWS_SECRET_ACCESS_KEY=your-secret-key
  ```

### 5. Test Email Sending with Personal Email
- **Goal**: Verify emails can be sent successfully using personal email
- **Tasks**:
  - Test cron job endpoint: `curl -X GET http://localhost:3000/api/cron/daily-newsletter`
  - Check personal email for received newsletter
  - Verify delivery tracking in database (`deliveries` table)
  - Test error handling scenarios (invalid recipients, etc.)

## Phase 3: Production Domain Setup

### 6. Configure Custom Domain (dailysystemdesign.com) in AWS SES
- **Goal**: Set up custom domain for professional email sending
- **Tasks**:
  - Add domain identity to Terraform configuration
  - Configure domain verification via DNS records
  - Set up subdomain for email (e.g., `mail.dailysystemdesign.com`)
  - Apply Terraform changes to create domain identity

### 7. Set Up DKIM, SPF, and DMARC Records for Domain
- **Goal**: Configure email authentication to improve deliverability
- **Tasks**:
  - Enable DKIM signing in SES for domain
  - Add DKIM CNAME records to DNS (from SES console)
  - Create SPF record: `"v=spf1 include:amazonses.com ~all"`
  - Set up DMARC record: `"v=DMARC1; p=quarantine; rua=mailto:dmarc@dailysystemdesign.com"`
  - Configure DNS records in domain registrar/DNS provider
- **DNS Records to Add**:
  ```
  TXT _amazonses.dailysystemdesign.com (verification token)
  CNAME xxx._domainkey.dailysystemdesign.com (DKIM)
  CNAME yyy._domainkey.dailysystemdesign.com (DKIM)
  CNAME zzz._domainkey.dailysystemdesign.com (DKIM)
  TXT dailysystemdesign.com "v=spf1 include:amazonses.com ~all"
  TXT _dmarc.dailysystemdesign.com "v=DMARC1; p=quarantine; rua=mailto:dmarc@dailysystemdesign.com"
  ```

### 8. Move SES Out of Sandbox Mode for Production
- **Goal**: Request production access to send to any email address
- **Tasks**:
  - Submit request to move out of SES sandbox
  - Provide use case details (newsletter service)
  - Explain sender reputation and bounce/complaint handling
  - Wait for AWS approval (typically 24-48 hours)
  - Update Terraform configuration if needed

### 9. Update Environment Variables for Production Domain
- **Goal**: Configure application to use custom domain for sending
- **Tasks**:
  - Update `ADMIN_EMAIL` environment variable
  - Add `FROM_EMAIL` environment variable (e.g., `newsletter@dailysystemdesign.com`)
  - Update newsletter template to use custom domain
  - Configure reply-to addresses appropriately
- **Updated Environment Variables**:
  ```bash
  FROM_EMAIL=newsletter@dailysystemdesign.com
  REPLY_TO_EMAIL=hello@dailysystemdesign.com
  ADMIN_EMAIL=your-personal@email.com  # Keep for admin testing
  ```

### 10. Test Production Email Sending with Custom Domain
- **Goal**: Verify end-to-end email delivery with custom domain
- **Tasks**:
  - Test cron job with production configuration
  - Send test emails to different providers (Gmail, Yahoo, Outlook)
  - Verify emails don't land in spam folders
  - Check email headers for proper DKIM signatures
  - Monitor bounce and complaint rates in SES console

## Implementation Files Structure

```
daily-system-design/
├── infrastructure/
│   ├── main.tf
│   ├── ses.tf
│   ├── iam.tf
│   ├── variables.tf
│   └── outputs.tf
├── src/server/email/
│   ├── providers/
│   │   └── awsSes.ts (update with real SES)
│   ├── emailService.ts (already exists)
│   └── types.ts (already exists)
└── AWS_SES_IMPLEMENTATION_PLAN.md (this file)
```

## Security Considerations

- **IAM Policies**: Use least-privilege access for SES permissions
- **Credentials**: Use IAM roles in production, avoid hardcoded keys
- **Rate Limiting**: Implement sending rate limits to avoid SES throttling
- **Bounce Handling**: Set up SNS topics for bounce and complaint notifications
- **Monitoring**: Configure CloudWatch alerts for high bounce/complaint rates

## Success Criteria

- ✅ Personal email receives test newsletters successfully
- ✅ Custom domain passes email authentication (DKIM, SPF, DMARC)
- ✅ Emails deliver to major providers without landing in spam
- ✅ SES is out of sandbox mode with production sending limits
- ✅ Infrastructure is fully managed by Terraform
- ✅ Proper monitoring and alerting is in place

## Estimated Timeline

- **Phase 1 (IaC Setup)**: 2-3 hours
- **Phase 2 (Personal Email Testing)**: 1-2 hours
- **Phase 3 (Production Domain)**: 3-4 hours + 24-48h AWS approval wait
- **Total**: 6-9 hours of active work + AWS approval time

---

**Next Steps**: Start with Phase 1 by setting up Terraform configuration for AWS SES infrastructure.