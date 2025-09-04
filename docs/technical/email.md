# Email System Documentation

## Overview

The email system powers newsletter delivery using AWS SES (Simple Email Service) for the Daily System Design newsletter. The system handles AI-generated content delivery, scheduled newsletter sending, and delivery tracking with comprehensive database logging.

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Admin Dashboard│    │  Newsletter Gen. │    │   tRPC Routers  │
│   (Preview/Send) │    │  (AI→HTML)       │    │   (API Layer)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ├────── Email Service Layer ─────────────────────┤
         │                       │                       │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AWS SES       │    │   Email Templates│    │  Delivery DB    │
│   (Provider)    │    │   (HTML/Text)    │    │  (Status/Logs)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Email Service Implementation

### Core Service (`src/server/email/emailService.ts`)

```typescript
class EmailService {
  private provider: EmailProvider;

  constructor(provider: EmailProvider) {
    this.provider = provider;
  }

  async sendEmail(request: EmailSendRequest): Promise<EmailSendResponse> {
    try {
      return await this.provider.sendEmail(request);
    } catch (error) {
      console.error("Email service error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown email error",
      };
    }
  }
}

// Singleton instance with AWS SES as default provider
export const emailService = new EmailService(awsSesProvider);
```

**Key Features**:
- Provider pattern for clean abstraction
- Centralized error handling and logging
- Type-safe requests/responses with Zod validation
- Singleton pattern for application-wide usage

### Type Definitions (`src/server/email/types.ts`)

```typescript
export const EmailSendRequestSchema = z.object({
  to: z.string().email(),
  from: z.string(),
  subject: z.string(),
  html: z.string(),
  text: z.string().optional(),
});

export const EmailSendResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string().optional(),
  error: z.string().optional(),
});

export interface EmailProvider {
  sendEmail(request: EmailSendRequest): Promise<EmailSendResponse>;
}
```

### AWS SES Provider (`src/server/email/providers/awsSes.ts`)

```typescript
class AwsSesProvider implements EmailProvider {
  private sesClient: SESClient;

  constructor() {
    this.sesClient = new SESClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async sendEmail(request: EmailSendRequest): Promise<EmailSendResponse> {
    try {
      const command = new SendEmailCommand({
        Source: request.from,
        Destination: {
          ToAddresses: [request.to],
        },
        Message: {
          Subject: {
            Data: request.subject,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: request.html,
              Charset: "UTF-8",
            },
            Text: request.text
              ? {
                  Data: request.text,
                  Charset: "UTF-8",
                }
              : undefined,
          },
        },
      });

      const response = await this.sesClient.send(command);

      return {
        success: true,
        messageId: response.MessageId,
      };
    } catch (error) {
      console.error("AWS SES error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "AWS SES send failed",
      };
    }
  }
}

export const awsSesProvider = new AwsSesProvider();
```

**Required Environment Variables**:
```env
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_REGION="us-west-2"
```

## Infrastructure Setup (Terraform)

### SES Domain Identity (`src/infra/modules/ses-domain-identity/main.tf`)

```hcl
# SES Domain Identity
resource "aws_ses_domain_identity" "domain" {
  domain = var.domain
}

# SES Domain Identity Verification
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

# Custom MAIL FROM Domain
resource "aws_ses_domain_mail_from" "mail_from" {
  domain           = aws_ses_domain_identity.domain.domain
  mail_from_domain = "${var.mail_from_subdomain}.${var.domain}"
  behavior_on_mx_failure = "UseDefaultValue"

  depends_on = [aws_ses_domain_identity_verification.domain_verification]
}
```

### SES Email Identity (`src/infra/modules/ses-email-identity/main.tf`)

```hcl
resource "aws_ses_email_identity" "admin_email_identity" {
  email = var.admin_email_address
}
```

### Required DNS Records (Manual Setup in Cloudflare)

Since you're using Cloudflare for DNS, these records must be added manually after Terraform deployment:

1. **Domain Verification**:
   ```
   Type: TXT
   Name: _amazonses.your-domain.com  
   Value: [verification_token from Terraform output]
   ```

2. **DKIM Records** (3 records from Terraform output):
   ```
   Type: CNAME
   Name: [token1]._domainkey.your-domain.com
   Value: [token1].dkim.amazonses.com
   ```

3. **MAIL FROM Domain**:
   ```
   Type: MX
   Name: mail.your-domain.com
   Value: feedback-smtp.us-west-2.amazonses.com
   Priority: 10
   
   Type: TXT  
   Name: mail.your-domain.com
   Value: "v=spf1 include:amazonses.com ~all"
   ```

## Email Templates

### Newsletter Template (`src/server/email/templates/newsletterTemplate.ts`)

The current implementation provides both HTML and plain text formats:

```typescript
export interface NewsletterEmailData {
  title: string;
  content: string;
  topicId: number;
  unsubscribeUrl?: string;
}

export function createNewsletterHtml(data: NewsletterEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .container {
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    /* Additional responsive email CSS... */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">${data.title}</h1>
      <p class="subtitle">Daily System Design Newsletter</p>
    </div>
    
    <div class="content">
${data.content}
    </div>
    
    <div class="footer">
      <p>This email was sent by Daily System Design Newsletter</p>
      ${data.unsubscribeUrl ? `<p><a href="${data.unsubscribeUrl}" class="unsubscribe">Unsubscribe</a></p>` : ""}
    </div>
  </div>
</body>
</html>`;
}

export function createNewsletterText(data: NewsletterEmailData): string {
  return `
${data.title}
Daily System Design Newsletter

${data.content}

---
This email was sent by Daily System Design Newsletter
${data.unsubscribeUrl ? `Unsubscribe: ${data.unsubscribeUrl}` : ""}`;
}
```

**Template Features**:
- Responsive design optimized for mobile and desktop
- Inline CSS for maximum email client compatibility
- Clean typography using system fonts
- Optional unsubscribe link support
- Consistent branding with header/footer sections

## Database Schema & Delivery Tracking

### Deliveries Table (`src/server/db/schema/deliveries.ts`)

```typescript
export const deliveryStatusEnum = pgEnum("delivery_status", [
  "pending",   // Queued for delivery
  "sent",      // Successfully sent to SES
  "delivered", // Confirmed delivery (via SES events)
  "failed",    // Send attempt failed
  "bounced",   // Email bounced back
]);

export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid().primaryKey().defaultRandom(),
    issueId: integer()
      .notNull()
      .references(() => issues.id),
    userId: uuid()
      .notNull()
      .references(() => users.id),
    status: deliveryStatusEnum().notNull().default("pending"),
    externalId: text(), // SES MessageId for tracking
    errorMessage: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    sentAt: timestamp({ withTimezone: true }),
    deliveredAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    index("delivery_issue_idx").on(table.issueId),
    index("delivery_user_idx").on(table.userId),
    index("delivery_status_idx").on(table.status),
    index("delivery_created_idx").on(table.createdAt),
    index("delivery_external_id_idx").on(table.externalId),
    index("delivery_user_issue_idx").on(table.userId, table.issueId),
  ],
);
```

### Zod Schemas for Type Safety

```typescript
export const DeliveryStatusSchema = z.enum(deliveryStatusEnum.enumValues);
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;

export const DeliveryUpdateSchema = z.object({
  status: DeliveryStatusSchema,
  externalId: z.string().optional(),
  errorMessage: z.string().optional(),
  sentAt: z.date().optional(),
  deliveredAt: z.date().optional(),
});
```

## tRPC Newsletter Router Integration

### Current Endpoints (`src/server/api/routers/newsletter.ts`)

```typescript
export const newsletterRouter = createTRPCRouter({
  // Get newsletter by topic ID
  getByTopicId: adminProcedure
    .input(z.object({ topicId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const issue = await issueRepo.findByTopicId(input.topicId);
      if (!issue) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No newsletter found for this topic",
        });
      }
      return issue;
    }),

  // Generate newsletter content
  generate: adminProcedure
    .input(z.object({ topicId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await generateNewsletterForTopic(input.topicId);
      return { success: true };
    }),

  // Send preview to admin
  sendToAdmin: adminProcedure
    .input(z.object({ topicId: z.number().int().positive() }))
    .output(SendNewsletterResponseSchema)
    .mutation(async ({ input }) => {
      const result = await sendNewsletterToAdmin({
        topicId: input.topicId,
      });
      return result;
    }),

  // Approve newsletter
  approve: adminProcedure
    .input(z.object({ topicId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const issue = await issueRepo.findByTopicId(input.topicId);
      if (!issue) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No newsletter found for this topic",
        });
      }

      if (!canApprove(issue.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot approve newsletter with status: ${issue.status}`,
        });
      }

      const updatedIssue = await issueRepo.update(issue.id, {
        status: "approved",
        approvedAt: new Date(),
      });

      return {
        success: true,
        status: updatedIssue?.status ?? "approved",
      };
    }),

  // Additional endpoints: unapprove, updateStatus...
});
```

**Key Features**:
- **JWT Authentication**: All endpoints require admin authentication via `adminProcedure`
- **Type Safety**: Input/output validation with Zod schemas
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Status Management**: Newsletter approval workflow with state validation

## Admin Dashboard Integration

The admin dashboard provides:
- **Preview Email**: Send test emails to admin for content review
- **Newsletter Generation**: Trigger AI content generation for topics
- **Approval Workflow**: Approve/unapprove newsletters before public sending
- **Status Management**: Track newsletter generation and sending status

## AWS SES Rate Limits & Considerations

### Current Limits (Default SES Account)
- **Sending Rate**: 14 emails per second
- **Daily Limit**: 50,000 emails per 24-hour period
- **Sandbox Mode**: Can only send to verified email addresses

### Important Notes for Production
1. **Request Production Access**: Remove sandbox restrictions
2. **Rate Limiting**: Implement batch processing to stay within limits
3. **Monitoring**: Set up CloudWatch alarms for bounces and complaints
4. **Reputation**: Maintain good sender reputation to avoid delivery issues

## Basic Monitoring Queries

### Delivery Performance
```sql
-- Daily delivery success rate (last 30 days)
SELECT 
  DATE(created_at) as date,
  status,
  COUNT(*) as count
FROM deliveries 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), status
ORDER BY date DESC;
```

### Error Analysis
```sql
-- Most common email failures
SELECT 
  error_message, 
  COUNT(*) as occurrences
FROM deliveries 
WHERE status = 'failed' AND error_message IS NOT NULL
GROUP BY error_message 
ORDER BY occurrences DESC
LIMIT 10;
```

## Development & Testing

### Local Development Setup

```bash
# 1. Configure AWS credentials
aws configure --profile daily-system-design-dev

# 2. Set up environment variables in .env
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_REGION="us-west-2"

# 3. Run development server
pnpm dev

# 4. Test via admin dashboard
# Navigate to http://localhost:3000/admin
# Use Newsletter Generator → Send to Admin
```

### Testing Checklist
1. **SES Configuration**: Verify domain and email identities
2. **Template Rendering**: Check HTML/text output
3. **Database Logging**: Confirm delivery records are created
4. **Error Handling**: Test various failure scenarios
5. **Admin Integration**: Verify tRPC endpoints work correctly

## Security Considerations

### Environment Variables
Never commit sensitive AWS credentials to version control:

```env
# .env (never commit)
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_REGION="us-west-2"
```

### Email Authentication
Your Terraform setup configures:
- **SPF Records**: Authorize AWS SES to send from your domain
- **DKIM Signing**: Cryptographically sign emails
- **Domain Verification**: Prove domain ownership

### Common Troubleshooting

1. **SES Sandbox Mode**
   ```
   Error: Email address not verified
   ```
   **Solution**: Verify recipient emails in SES Console or request production access

2. **DNS Verification Issues**
   ```
   Error: Domain not verified
   ```
   **Solution**: Check DNS records in Cloudflare match Terraform outputs

3. **Authentication Failures**
   ```
   Error: The request signature we calculated does not match
   ```
   **Solution**: Verify AWS credentials and region configuration

This documentation covers the current email implementation in your codebase. As you add features like cron jobs, batch processing, or advanced analytics, this document should be updated to reflect those additions.