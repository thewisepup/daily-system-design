# Email System

## Overview
The email system handles newsletter delivery using a provider-agnostic architecture with AWS SES as the primary email service. The system supports HTML/text email formatting, delivery tracking, and error handling.

## Architecture

### Service Layer
- **Email Service**: `src/server/email/emailService.ts` - Main service interface
- **Provider Pattern**: Pluggable email providers for different services
- **Templates**: Reusable email templates with consistent branding
- **Delivery Tracking**: Database logging of all email attempts

### Core Components

#### EmailService Class
```typescript
class EmailService {
  private provider: EmailProvider;

  async sendEmail(request: EmailSendRequest): Promise<EmailSendResponse> {
    return await this.provider.sendEmail(request);
  }

  setProvider(provider: EmailProvider) {
    this.provider = provider;
  }
}
```

**Features**:
- Provider abstraction for easy switching
- Consistent error handling across providers
- Singleton instance for application-wide use

## Email Providers

### AWS SES Provider (`src/server/email/providers/awsSes.ts`)
Currently the primary email provider with the following features:
- **Scalability**: Handles high-volume email sending
- **Deliverability**: High inbox placement rates
- **Cost Effective**: Pay-per-email pricing model
- **Compliance**: Built-in bounce/complaint handling

**Configuration**:
```typescript
// Environment variables required
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_SES_FROM_EMAIL="noreply@yourapp.com"
```

### Future Providers
The architecture supports additional providers:
- **Postmark**: High deliverability for transactional emails
- **SendGrid**: Feature-rich email platform
- **Resend**: Developer-friendly email API

## Email Templates

### Newsletter Template (`src/server/email/templates/newsletterTemplate.ts`)

#### HTML Template
```typescript
export function createNewsletterHtml({
  title,
  content,
  topicId,
}: NewsletterEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <!-- Responsive email CSS -->
    </head>
    <body>
      <div class="container">
        <header>
          <h1>Daily System Design</h1>
        </header>
        <main>
          <h2>${title}</h2>
          ${markdownToHtml(content)}
        </main>
        <footer>
          <p>Topic #${topicId}</p>
        </footer>
      </div>
    </body>
    </html>
  `;
}
```

#### Text Template
```typescript
export function createNewsletterText({
  title,
  content,
  topicId,
}: NewsletterEmailData): string {
  return `
Daily System Design

${title}

${content}

---
Topic #${topicId}
  `;
}
```

### Template Features
- **Responsive Design**: Mobile-optimized HTML layout
- **Markdown Support**: Converts markdown content to HTML
- **Branding**: Consistent header/footer across emails
- **Accessibility**: Proper semantic HTML structure

## Email Types

### Newsletter Emails
- **Subject**: Dynamic based on topic title
- **From**: `Daily System Design <noreply@domain.com>`
- **Content**: AI-generated newsletter content
- **Schedule**: Daily at 9am PT via cron job

### Preview Emails (Admin)
- **Subject**: `[PREVIEW] Topic Title`
- **Recipient**: Admin email only
- **Purpose**: Testing and content review
- **Trigger**: Manual send via admin dashboard

## Delivery Tracking

### Database Logging
Every email send attempt creates a `deliveries` record:

```typescript
// Create delivery record
const delivery = await deliveryRepo.create({
  issueId: issue.id,
  userId: user.id,
  status: 'pending',
});

// Update after send attempt
await deliveryRepo.updateStatus(delivery.id, 'sent', {
  externalId: emailResponse.messageId,
  sentAt: new Date(),
});
```

### Status Types
- **Pending**: Email queued for delivery
- **Sent**: Successfully sent to email provider
- **Failed**: Send attempt failed
- **Bounced**: Email bounced (future implementation)

### Error Handling
```typescript
try {
  const emailResponse = await emailService.sendEmail(emailRequest);
  if (emailResponse.success) {
    await deliveryRepo.updateStatus(delivery.id, 'sent', {
      externalId: emailResponse.messageId,
    });
  } else {
    await deliveryRepo.updateStatus(delivery.id, 'failed', {
      errorMessage: emailResponse.error,
    });
  }
} catch (error) {
  await deliveryRepo.updateStatus(delivery.id, 'failed', {
    errorMessage: error.message,
  });
}
```

## Email Content Generation

### Newsletter Content Flow
1. **Topic Selection**: Cron job selects next topic in sequence
2. **Content Retrieval**: Fetch approved newsletter from database
3. **Template Processing**: Apply content to HTML/text templates
4. **Email Creation**: Build email request with headers
5. **Delivery Attempt**: Send via email service
6. **Status Tracking**: Log delivery result

### Content Processing
```typescript
// Prepare email content
const emailHtml = createNewsletterHtml({
  title: issue.title,
  content: issue.content, // Markdown content
  topicId: topicId,
});

const emailText = createNewsletterText({
  title: issue.title,
  content: issue.content,
  topicId: topicId,
});
```

## Cron Job Integration

### Daily Newsletter Cron (`src/app/api/cron/daily-newsletter/route.ts`)
- **Schedule**: Daily at 9am PT (configured in Vercel)
- **Authentication**: `CRON_SECRET` for security
- **Process**: Find first topic → Send to admin → Log delivery
- **Error Handling**: Graceful failure with detailed logging

```typescript
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find and send newsletter
  const result = await sendNewsletterToAdmin({ topicId: firstTopic.id });
  
  return NextResponse.json({
    success: true,
    data: result,
  });
}
```

## Testing and Development

### Testing Email Templates
```bash
# Development server with email preview
pnpm dev

# Admin dashboard → Newsletter Generator → Preview
# Generates HTML/text templates for review
```

### Manual Email Sending
```typescript
// Via admin dashboard
const sendMutation = api.newsletter.sendToAdmin.useMutation({
  onSuccess: (data) => {
    console.log('Email sent:', data.messageId);
  },
  onError: (error) => {
    console.error('Send failed:', error.message);
  },
});
```

### Email Provider Testing
```bash
# Test AWS SES configuration
curl -X POST localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test"}'
```

## Security Considerations

### Email Security
- **SPF Records**: Authorize sending servers
- **DKIM Signing**: Email authentication signatures
- **DMARC Policy**: Email spoofing protection
- **SSL/TLS**: Encrypted transmission

### Content Security
- **Input Sanitization**: Prevent HTML/script injection
- **Template Escaping**: Safe content rendering
- **Rate Limiting**: Prevent email abuse
- **Unsubscribe Links**: CAN-SPAM compliance (future)

## Monitoring and Analytics

### Email Metrics
- **Delivery Rate**: Successful sends / total attempts
- **Bounce Rate**: Hard/soft bounces percentage
- **Open Rate**: Email opens (future pixel tracking)
- **Click Rate**: Link clicks (future link tracking)

### Database Queries
```sql
-- Daily email delivery stats
SELECT 
  DATE(created_at) as date,
  status,
  COUNT(*) as count
FROM deliveries 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), status
ORDER BY date DESC;

-- Email failure analysis
SELECT error_message, COUNT(*) as occurrences
FROM deliveries 
WHERE status = 'failed' 
GROUP BY error_message 
ORDER BY occurrences DESC;
```

## Future Enhancements

### Subscriber Management
- **Unsubscribe Handling**: One-click unsubscribe links
- **Preference Center**: Email frequency/topic preferences
- **Bounce Management**: Automatic list cleaning

### Advanced Features
- **A/B Testing**: Subject line and content testing
- **Personalization**: Dynamic content per subscriber
- **Analytics Dashboard**: Email performance metrics
- **Webhook Processing**: Real-time delivery status updates

### Multi-Provider Failover
```typescript
// Automatic provider switching on failure
class EmailService {
  private providers: EmailProvider[] = [awsSesProvider, sendGridProvider];
  
  async sendEmail(request: EmailSendRequest): Promise<EmailSendResponse> {
    for (const provider of this.providers) {
      try {
        return await provider.sendEmail(request);
      } catch (error) {
        console.error(`Provider ${provider.name} failed:`, error);
        continue; // Try next provider
      }
    }
    throw new Error('All email providers failed');
  }
}
```