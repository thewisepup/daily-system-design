# Welcome Email Implementation

## Overview
Implementation of automated welcome emails sent to new users upon newsletter signup. This system uses AWS SES with a dedicated transactional email configuration set and extends the existing delivery tracking infrastructure.

## Architecture Decisions

### Email Configuration Strategy
- **Separate Configuration Set**: Uses `daily-system-design-transactional` for transactional emails
- **Newsletter Separation**: Keeps marketing emails (`daily-system-design-newsletter`) separate from transactional emails
- **Analytics Clarity**: Enables distinct tracking and deliverability metrics per email type

### Database Schema Approach
- **Extend Existing Table**: Add `email_type` field to existing `deliveries` table
- **Migration Path**: Designed for easy migration to separate `transactional_emails` table if needed
- **Type Safety**: Uses TypeScript enum for email type validation

## Technical Specifications

### TransactionalEmailType Enum
```typescript
export enum TransactionalEmailType {
  WELCOME = 'welcome',
  // Future extensibility:
  // PASSWORD_RESET = 'password_reset',
  // EMAIL_VERIFICATION = 'email_verification',
  // ACCOUNT_DELETED = 'account_deleted',
}
```

### Database Schema Changes
```sql
-- Add email_type column to deliveries table
ALTER TABLE deliveries 
ADD COLUMN email_type VARCHAR(50) NOT NULL DEFAULT 'newsletter';

-- Create index for filtering by email type
CREATE INDEX delivery_email_type_idx ON deliveries(email_type);
```

### Email Template System
- **Location**: `src/server/email/templates/`
- **Function**: `getWelcomeEmail()` with substitution support
- **Content**: Welcome message + newsletter expectations
- **Extensibility**: Simple string replacement system for future personalization

### AWS SES Configuration
- **Configuration Set Name**: `daily-system-design-transactional`
- **Event Publishing**: Not implemented initially (future TODO)
- **Bounce Handling**: Planned for future implementation

## Implementation Components

### 1. Type Definitions (`src/server/email/types.ts`)
- Add `TransactionalEmailType` enum
- Extend existing email interfaces to support transactional emails

### 2. Database Schema (`src/server/db/schema/deliveries.ts`)
- Add `emailType` field using TransactionalEmailType enum
- Update indexes and constraints

### 3. Email Templates (`src/server/email/templates/index.ts`)
- `getWelcomeEmail()` function with substitution support
- Template content and structure

### 4. Email Service (`src/server/email/emailService.ts`)
- `sendWelcomeEmail(userId)` method
- Integration with transactional configuration set
- Delivery tracking with email type

### 5. User Registration (`src/server/api/routers/user.ts`)
- Update `addToWaitlist` procedure
- Send welcome email after successful user creation
- Error handling: signup succeeds even if email fails

### 6. Frontend Updates
- Update signup success confirmation message
- Inform users about welcome email delivery

### 7. Infrastructure (`infra/`)
- Terraform configuration for SES transactional configuration set
- Environment variable configuration

## User Flow

### Signup Process
1. User enters email on landing page
2. `addToWaitlist` tRPC procedure validates and creates user
3. Welcome email is sent asynchronously via `sendWelcomeEmail(userId)`
4. Delivery record created with `email_type: 'WELCOME'`
5. Success confirmation shows email has been sent
6. User receives welcome email with newsletter expectations

### Error Handling
- Email send failure does not affect signup success
- Errors are logged for monitoring
- Failed delivery records are created for tracking

## Welcome Email Content
```
Subject: Welcome to Daily System Design!

Hi there,

Welcome to Daily System Design! We're excited to have you join our community of engineers learning system design.

## What to Expect
- Daily system design topics delivered to your inbox
- Real-world examples and case studies  
- Progressive learning from fundamentals to advanced concepts
- Practical insights you can apply in interviews and work

We'll notify you when Daily System Design officially launches. In the meantime, thank you for joining our waitlist!

Best regards,
The Daily System Design Team
```

## Future Enhancements

### Bounce Handling
- Configure AWS SES event publishing for transactional configuration set
- Process bounce and complaint notifications
- Implement hard bounce removal logic
- Add delivery status webhooks

### Template Expansion
- Add more transactional email types
- Implement dynamic content substitution
- Create email template management system
- Add A/B testing capabilities

### Analytics
- User-level email engagement tracking
- Open and click tracking for welcome emails
- Delivery success rate monitoring
- Comparative analytics vs newsletter emails

### Migration Path to Separate Table
If transactional email requirements diverge significantly:

```sql
-- Future: Migrate to separate transactional_emails table
CREATE TABLE transactional_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  email_type VARCHAR(50) NOT NULL,
  template_name VARCHAR(100),
  substitution_data JSONB,
  status delivery_status NOT NULL,
  external_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

## Configuration

### Environment Variables
```bash
# AWS SES Configuration
AWS_SES_TRANSACTIONAL_CONFIG_SET=daily-system-design-transactional

# Email Settings (existing)
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### Terraform Variables
```hcl
# Add to dev.tfvars / prod.tfvars
transactional_config_set_name = "daily-system-design-transactional"
```

## Testing Strategy

### Unit Tests
- Email template rendering
- Welcome email service method
- Database delivery tracking
- Error handling scenarios

### Integration Tests
- End-to-end signup with welcome email
- AWS SES configuration set usage
- Delivery record creation
- Frontend confirmation message

### Manual Testing
- Test signup flow with real email
- Verify welcome email delivery
- Check delivery tracking in admin dashboard
- Validate error scenarios

## Monitoring and Observability

### Metrics to Track
- Welcome email delivery success rate
- Time to delivery after signup
- Bounce/complaint rates for welcome emails
- Template rendering errors

### Logging
- Email send attempts and results
- Template generation errors
- AWS SES API responses
- User signup correlation with email delivery

## Security Considerations

### Data Privacy
- Minimal data collection for welcome emails
- No sensitive information in email templates
- Secure credential management for AWS SES

### Email Authentication
- SPF, DKIM, and DMARC configuration
- Sender reputation management
- Dedicated configuration set isolation

## Rollout Plan

### Phase 1: Core Implementation
- ✅ Basic welcome email functionality
- ✅ Database schema extension
- ✅ Email template system
- ✅ User registration integration

### Phase 2: Infrastructure
- ✅ AWS SES transactional configuration set
- ✅ Environment configuration
- ✅ Terraform integration

### Phase 3: Enhanced Tracking (Future)
- Event publishing configuration
- Bounce/complaint handling
- Advanced analytics
- Template personalization

This implementation provides a solid foundation for transactional emails while maintaining clean separation from newsletter functionality and preserving an easy migration path for future enhancements.