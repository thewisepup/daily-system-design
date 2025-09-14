# Phase 1 Complete Implementation Plan: SNS Webhook Integration

## Missing Component: SES Event Destination Configuration

### Problem
The initial implementation was missing the Terraform configuration for SES event destinations. The SES configuration sets need to be configured to send bounce events to the SNS topic.

### Solution: Create SES Configuration Set Event Destination Module

#### New Module: `infra/modules/ses-event-destination/`
- **Purpose:** Configure SES configuration sets to send events to SNS
- **Files:** variables.tf, main.tf, outputs.tf
- **Configuration:** Links existing SES config sets (TransactionalEmails, NewsletterEmails) to SNS topic
- **Event Types:** Only bounce events (not complaints)

#### Updated Infrastructure in `infra/main.tf`
- **Add:** SNS topic module instantiation
- **Add:** Event destination modules for both TransactionalEmails and NewsletterEmails config sets
- **Dependencies:** Event destinations depend on SNS topic creation
- **Integration:** Uses existing SES config sets that are already created

## Complete Infrastructure Components

### 1. SNS Topic Module (`infra/modules/sns-topic/`)
- Creates SNS topic: `daily-system-design-ses-bounces-{env}`
- Creates HTTPS subscription to webhook endpoint
- Sets up IAM policy for SES to publish to SNS
- Follows existing naming conventions

### 2. SES Event Destination Module (`infra/modules/ses-event-destination/`)
- Configures existing SES configuration sets
- Links TransactionalEmails config set → SNS topic
- Links NewsletterEmails config set → SNS topic
- Only sends bounce events (not complaints, opens, clicks)

### 3. Updated Main Infrastructure
- Adds SNS topic module with webhook endpoint variable
- Adds two event destination modules (one per config set)
- Proper dependency management between modules
- Outputs SNS topic ARN for application use

## Application Implementation

### 1. Next.js Webhook (`src/app/api/webhook/ses-bounce/route.ts`)
- Validates SNS message signatures
- Validates SNS topic ARN matches environment
- Handles SubscriptionConfirmation and Notification messages
- Processes only permanent bounces
- Updates subscription status to 'cancelled'

### 2. Database Integration (`src/server/db/repo/SubscriptionRepo.ts`)
- New method: `cancelSubscriptionsByEmail(email: string)`
- Updates all active subscriptions for email to 'cancelled' status
- Returns count of cancelled subscriptions
- Follows existing repository patterns

### 3. Environment Variables (`src/env.js`)
- Add `SNS_SES_BOUNCES_TOPIC_ARN` to server environment variables
- Used for webhook validation

## Development Workflow

### Infrastructure Deployment
```bash
# Update infra/dev.tfvars with ngrok URL
# ses_webhook_endpoint = "https://abc123.ngrok.io/api/webhook/ses-bounce"

cd infra
terraform workspace select dev
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars

# Note SNS topic ARN for environment variables
terraform output sns_ses_bounces_topic_arn
```

### ngrok Setup
```bash
# Start development server
pnpm dev

# Start ngrok tunnel (separate terminal)
ngrok http 3000

# Copy HTTPS URL to dev.tfvars and redeploy infrastructure
```

### Testing
```bash
# Confirm SNS subscription (check webhook logs for SubscribeURL)
# Send test email to bounce@simulator.amazonses.com
# Verify subscription status changes to 'cancelled' in database
```

## Production Deployment

### Infrastructure
```bash
# Update infra/prod.tfvars with production webhook URL
# ses_webhook_endpoint = "https://your-domain.com/api/webhook/ses-bounce"

cd infra
terraform workspace select prod
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

### Environment Variables
- Add `SNS_SES_BOUNCES_TOPIC_ARN` to production environment
- Use terraform output to get the correct ARN for each environment

## Key Benefits of Complete Plan

1. **Fully Automated:** No manual AWS CLI commands for SES event destinations
2. **Environment Isolated:** Separate SNS topics and event destinations per environment
3. **Modular:** Reusable modules following existing terraform patterns
4. **Integrated:** Works with existing SES configuration sets
5. **Secure:** SNS signature validation and topic ARN validation

## Files to Create/Modify

### New Files
- `infra/modules/sns-topic/` (variables.tf, main.tf, outputs.tf)
- `infra/modules/ses-event-destination/` (variables.tf, main.tf, outputs.tf)
- `src/app/api/webhook/ses-bounce/route.ts`

### Modified Files
- `infra/main.tf` (add SNS and event destination modules)
- `infra/variables.tf` (add webhook endpoint variable)
- `infra/outputs.tf` (add SNS outputs)
- `infra/dev.tfvars` and `infra/prod.tfvars` (add webhook endpoints)
- `src/server/db/repo/SubscriptionRepo.ts` (add email cancellation method)
- `src/env.js` (add SNS topic ARN variable)

## Infrastructure Dependencies

```
SES Configuration Sets (existing)
    ↓
SNS Topic Module
    ↓
SES Event Destination Modules
    ↓
Next.js Webhook
    ↓
Database Update
```

## Implementation Steps

### Step 1: Create Infrastructure Modules
1. Create `infra/modules/sns-topic/` with variables, main, outputs
2. Create `infra/modules/ses-event-destination/` with variables, main, outputs
3. Update `infra/main.tf` to include both modules
4. Update `infra/variables.tf` to add webhook endpoint variable
5. Update `infra/outputs.tf` to expose SNS topic ARN

### Step 2: Deploy Development Infrastructure
```bash
# Start ngrok
ngrok http 3000

# Update dev.tfvars with ngrok URL
cd infra
terraform workspace select dev
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars
```

### Step 3: Implement Application Components
1. Create Next.js webhook API route with SNS validation
2. Extend SubscriptionRepo with email cancellation method
3. Update environment variables with SNS topic ARN
4. Test webhook with SES bounce simulator

### Step 4: Deploy Production Infrastructure
```bash
# Update prod.tfvars with production webhook URL
cd infra
terraform workspace select prod
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

### Step 5: Validation Testing
1. Confirm SNS subscription via webhook logs
2. Send test bounce email via SES simulator
3. Verify subscription cancellation in database
4. Monitor CloudWatch logs for event delivery

## Success Criteria
- ✅ SES configuration sets automatically send bounce events to SNS
- ✅ SNS topics created for each environment with proper security
- ✅ Webhook validates SNS signatures and topic ARNs
- ✅ Hard bounces automatically cancel user subscriptions
- ✅ No manual AWS CLI configuration required
- ✅ Development workflow supports ngrok seamlessly
- ✅ Production deployment fully automated

## Monitoring & Troubleshooting

### Common Issues
1. **SNS Subscription Not Confirmed**
   - Check webhook logs for SubscriptionConfirmation message
   - Manually confirm via AWS SNS console

2. **Invalid Topic ARN Error**
   - Verify environment variable matches deployed topic ARN
   - Check terraform outputs match environment

3. **No Bounce Events Received**
   - Verify SES event destinations are created
   - Check SES is using correct configuration sets

4. **ngrok URL Changes**
   - Update dev.tfvars with new ngrok URL
   - Re-run terraform apply to update SNS subscription

### Logs to Monitor
- Next.js application logs (webhook processing)
- CloudWatch SES logs (event publishing)
- SNS topic delivery logs
- Database query logs (subscription updates)

### AWS CLI Verification Commands
```bash
# List SES configuration sets
aws ses list-configuration-sets

# Describe event destinations for a config set
aws ses describe-configuration-set --configuration-set-name TransactionalEmails

# List SNS topics
aws sns list-topics

# Get SNS topic attributes
aws sns get-topic-attributes --topic-arn <sns-topic-arn>
```

## Next Steps
After Phase 1 completion:
1. Implement full SNS signature verification using AWS SDK
2. Add automatic SNS subscription confirmation
3. Add webhook failure alerting mechanism
4. Move to Phase 2: CloudWatch Monitoring setup
5. Consider adding dead letter queue for failed webhook processing