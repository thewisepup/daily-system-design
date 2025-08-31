# Email Sending and Delivery

## Overview
The email sending system manages the delivery of Daily System Design newsletters to subscribers. Currently optimized for admin preview delivery during MVP phase, with architecture designed to scale to thousands of subscribers upon full launch.

## Business Objectives

### Delivery Goals
- **Reliable Delivery**: 99%+ successful delivery rate to valid email addresses
- **Inbox Placement**: High deliverability with minimal spam folder placement
- **Consistent Schedule**: Daily delivery at 9am PT for subscriber engagement
- **Quality Content**: Professional email formatting with excellent readability
- **Performance Tracking**: Comprehensive delivery and engagement analytics

### User Experience Goals
- **Professional Presentation**: Well-formatted HTML emails with fallback text
- **Mobile Optimization**: Excellent rendering across all email clients
- **Fast Loading**: Optimized email size for quick loading
- **Clear Branding**: Consistent Daily System Design branding and voice
- **Actionable Content**: Easy-to-read technical content with clear structure

## Current Email Delivery Flow

### Admin Preview Workflow (MVP Phase)
1. **Newsletter Generation**: Admin generates newsletter content for specific topic
2. **Content Approval**: Admin reviews and approves generated newsletter
3. **Preview Send**: Admin clicks "Send to Admin" for email preview
4. **Email Creation**: System formats content into HTML/text email templates
5. **Delivery Execution**: Email sent via AWS SES to admin email address
6. **Delivery Tracking**: System logs delivery attempt and results in database
7. **Status Update**: Admin receives confirmation of successful delivery

### Technical Implementation
```typescript
// Admin triggers email sending for preview
const sendMutation = api.newsletter.sendToAdmin.useMutation({
  onMutate: () => {
    setIsSending(true);
    setStatus('Sending newsletter preview...');
  },
  onSuccess: (data) => {
    setStatus(`✅ Newsletter sent successfully! Message ID: ${data.messageId}`);
    setLastDeliveryId(data.deliveryId);
  },
  onError: (error) => {
    setStatus(`❌ Send failed: ${error.message}`);
  },
  onSettled: () => setIsSending(false),
});
```

### Server-Side Delivery Process
```typescript
export async function sendNewsletterToAdmin({ topicId }: SendNewsletterRequest) {
  // 1. Validate newsletter exists and is approved
  const issue = await issueRepo.findByTopicId(topicId);
  if (!issue || issue.status !== 'approved') {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Newsletter must be approved before sending",
    });
  }

  // 2. Get or create admin user record
  let adminUser = await userRepo.findByEmail(env.ADMIN_EMAIL);
  if (!adminUser) {
    adminUser = await userRepo.create({ email: env.ADMIN_EMAIL });
  }

  // 3. Create delivery tracking record
  const delivery = await deliveryRepo.create({
    issueId: issue.id,
    userId: adminUser.id,
    status: 'pending',
  });

  // 4. Format email content
  const emailHtml = createNewsletterHtml({
    title: issue.title,
    content: issue.content,
    topicId,
  });

  const emailText = createNewsletterText({
    title: issue.title,
    content: issue.content,
    topicId,
  });

  // 5. Send via email service
  const emailResponse = await emailService.sendEmail({
    to: env.ADMIN_EMAIL,
    from: `Daily System Design <noreply@${domain}>`,
    subject: `[PREVIEW] ${issue.title}`,
    html: emailHtml,
    text: emailText,
  });

  // 6. Update delivery status
  if (emailResponse.success) {
    await deliveryRepo.updateStatus(delivery.id, 'sent', {
      externalId: emailResponse.messageId,
      sentAt: new Date(),
    });

    return {
      success: true,
      deliveryId: delivery.id,
      messageId: emailResponse.messageId,
    };
  } else {
    await deliveryRepo.updateStatus(delivery.id, 'failed', {
      errorMessage: emailResponse.error,
    });

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Email delivery failed: ${emailResponse.error}`,
    });
  }
}
```

## Email Template Design

### HTML Email Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
    /* Mobile-first responsive design */
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
    .content { background: white; padding: 30px; line-height: 1.6; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; }
    
    /* Typography */
    h1 { font-size: 24px; margin-bottom: 10px; }
    h2 { font-size: 20px; color: #1f2937; margin-top: 30px; }
    code { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
    pre { background: #f3f4f6; padding: 15px; border-radius: 6px; overflow-x: auto; }
    
    /* Mobile responsiveness */
    @media only screen and (max-width: 600px) {
      .container { padding: 10px; }
      .content { padding: 20px; }
      h1 { font-size: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Daily System Design</h1>
      <p>{{subtitle}}</p>
    </div>
    <div class="content">
      <h2>{{title}}</h2>
      {{content_html}}
    </div>
    <div class="footer">
      <p>Topic #{{topicId}} | Daily System Design Newsletter</p>
      <p>You're receiving this because you signed up for system design insights.</p>
    </div>
  </div>
</body>
</html>
```

### Plain Text Template
```text
Daily System Design
{{title}}

{{content_text}}

---
Topic #{{topicId}}
Daily System Design Newsletter

You're receiving this because you signed up for system design insights.
```

### Content Processing
```typescript
function createNewsletterHtml({ title, content, topicId }: NewsletterData): string {
  // Convert markdown to HTML
  const contentHtml = markdownToHtml(content);
  
  // Apply email template
  return htmlTemplate
    .replace('{{title}}', escapeHtml(title))
    .replace('{{content_html}}', contentHtml)
    .replace('{{topicId}}', topicId.toString())
    .replace('{{subtitle}}', `Topic #${topicId}`)
    .replace(/{{domain}}/g, env.DOMAIN_NAME);
}

function createNewsletterText({ title, content, topicId }: NewsletterData): string {
  // Convert markdown to plain text
  const contentText = markdownToText(content);
  
  return textTemplate
    .replace('{{title}}', title)
    .replace('{{content_text}}', contentText)
    .replace('{{topicId}}', topicId.toString());
}
```

## Email Service Provider (AWS SES)

### Provider Configuration
```typescript
// AWS SES Configuration
export const awsSesProvider: EmailProvider = {
  name: 'AWS SES',
  
  async sendEmail(request: EmailSendRequest): Promise<EmailSendResponse> {
    try {
      const sesClient = new SESv2Client({
        region: env.AWS_REGION,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      });

      const command = new SendEmailCommand({
        FromEmailAddress: request.from,
        Destination: {
          ToAddresses: [request.to],
        },
        Content: {
          Simple: {
            Subject: {
              Data: request.subject,
              Charset: 'UTF-8',
            },
            Body: {
              Html: {
                Data: request.html,
                Charset: 'UTF-8',
              },
              Text: {
                Data: request.text,
                Charset: 'UTF-8',
              },
            },
          },
        },
      });

      const result = await sesClient.send(command);
      
      return {
        success: true,
        messageId: result.MessageId,
      };
    } catch (error) {
      console.error('AWS SES Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SES error',
      };
    }
  },
};
```

### Delivery Optimization
- **Sending Limits**: AWS SES sandbox limits (200 emails/day initially)
- **Rate Limiting**: Respect SES sending rate (14 emails/second max)
- **IP Warming**: Gradual increase in sending volume for better deliverability
- **Domain Authentication**: SPF, DKIM, and DMARC records for sender reputation

## Automated Daily Delivery (Cron Job)

### Daily Newsletter Cron
```typescript
// /api/cron/daily-newsletter/route.ts
export async function GET(request: NextRequest) {
  // Verify cron authorization
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Get or create newsletter sequence tracker for System Design
    const sequenceTracker = await newsletterSequenceRepo.getOrCreate(SYSTEM_DESIGN_SUBJECT_ID);
    if (!sequenceTracker) {
      return NextResponse.json({ error: "Failed to initialize newsletter sequence" }, { status: 500 });
    }
    
    const currentSequence = sequenceTracker.currentSequence;
    console.log(`Current sequence for System Design: ${currentSequence}`);

    // 2. Find topic with the current sequence number
    const currentTopic = await topicRepo.findBySubjectIdAndSequence(
      SYSTEM_DESIGN_SUBJECT_ID,
      currentSequence
    );

    if (!currentTopic) {
      return NextResponse.json({ error: `No topic found for sequence #${currentSequence}` }, { status: 404 });
    }

    // 3. Send newsletter to admin (MVP behavior)
    const result = await sendNewsletterToAdmin({ topicId: currentTopic.id });

    // 4. Increment sequence counter and update timestamp
    await newsletterSequenceRepo.incrementSequence(SYSTEM_DESIGN_SUBJECT_ID);
    await newsletterSequenceRepo.update(SYSTEM_DESIGN_SUBJECT_ID, { lastSentAt: new Date() });

    console.log(`Incremented sequence to ${currentSequence + 1} for next delivery`);

    return NextResponse.json({
      success: true,
      message: "Daily newsletter sent successfully",
      data: {
        sequence: currentSequence,
        nextSequence: currentSequence + 1,
        topicId: currentTopic.id,
        topicTitle: currentTopic.title,
        deliveryId: result.deliveryId,
        messageId: result.messageId,
      },
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
```

### Newsletter Sequence Tracking
The daily newsletter system now uses automatic sequence progression:

#### Sequence Management Process
1. **Initialization**: First cron run creates `newsletter_sequence` record with `currentSequence: 1`
2. **Daily Execution**: Cron job reads current sequence number from database
3. **Topic Lookup**: Finds topic matching the current sequence order
4. **Newsletter Delivery**: Sends approved newsletter for that specific topic
5. **Sequence Advancement**: Increments sequence counter for next day's delivery
6. **Audit Trail**: Updates `lastSentAt` timestamp for monitoring

#### Benefits of Sequence Tracking
- **Automatic Progression**: No manual intervention needed for daily topic advancement
- **Reliability**: Survives server restarts and deployment cycles
- **Monitoring**: Clear visibility into which topics have been sent and when
- **Flexibility**: Easy to reset or adjust sequence numbers when needed
- **Multi-Subject Support**: Separate sequence tracking for future newsletter topics

#### Sequence Reset and Management
```sql
-- Check current sequence status
SELECT s.name, ns.current_sequence, ns.last_sent_at 
FROM newsletter_sequence ns
JOIN subjects s ON ns.subject_id = s.id;

-- Reset sequence to specific number (if needed)
UPDATE newsletter_sequence 
SET current_sequence = 1, updated_at = NOW()
WHERE subject_id = 1;

-- Skip to specific sequence number
UPDATE newsletter_sequence 
SET current_sequence = 50, updated_at = NOW()
WHERE subject_id = 1;
```

### Cron Schedule Configuration
```bash
# Vercel cron configuration (vercel.json)
{
  "crons": [
    {
      "path": "/api/cron/daily-newsletter",
      "schedule": "0 16 * * *"  // 9am PT = 4pm UTC (winter) / 5pm UTC (summer)
    }
  ]
}
```

## Delivery Tracking and Analytics

### Database Tracking
Every email attempt creates a delivery record:
```sql
-- Delivery tracking table
CREATE TABLE deliveries (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  issue_id INTEGER NOT NULL REFERENCES issues(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status delivery_status NOT NULL DEFAULT 'pending',
  external_id TEXT,           -- Email provider message ID
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### Delivery Status Types
- **Pending**: Email queued for sending
- **Sent**: Successfully delivered to email provider
- **Failed**: Delivery attempt failed (invalid email, quota exceeded, etc.)
- **Bounced**: Email bounced (hard/soft bounce) - future implementation

### Analytics Queries
```sql
-- Daily delivery success rate
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful_deliveries,
  ROUND(
    COUNT(CASE WHEN status = 'sent' THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as success_rate
FROM deliveries 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Error analysis
SELECT 
  error_message,
  COUNT(*) as occurrences,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM deliveries WHERE status = 'failed'), 2) as percentage
FROM deliveries 
WHERE status = 'failed' 
GROUP BY error_message 
ORDER BY occurrences DESC;
```

## Email Deliverability Strategy

### Sender Reputation Management
- **Domain Authentication**: Proper SPF, DKIM, DMARC setup
- **Consistent From Address**: Always send from same domain
- **Professional Content**: Avoid spam trigger words and formatting
- **List Hygiene**: Remove bounced and unsubscribed emails
- **Engagement Monitoring**: Track open rates and subscriber feedback

### DNS Configuration
```dns
; SPF record
@ IN TXT "v=spf1 include:amazonses.com ~all"

; DKIM record (provided by AWS SES)
ses._domainkey IN CNAME ses.dkim.amazonses.com

; DMARC record
_dmarc IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@dailysystemdesign.com"
```

### Content Optimization
- **Clear Subject Lines**: Descriptive, non-promotional subjects
- **Text/HTML Balance**: Always include plain text version
- **Image Optimization**: Minimal images, proper alt text
- **Link Management**: Use reputable domains, avoid excessive links
- **Unsubscribe Header**: Include List-Unsubscribe header (future)

## Scaling to Full Subscriber Base

### Transition from MVP to Production
When scaling from admin-only to full subscriber base:

1. **Subscriber Segmentation**: Group users by subscription preferences
2. **Delivery Sequence**: Implement proper topic sequence tracking per user
3. **Batch Processing**: Send emails in batches to manage rate limits
4. **Error Handling**: Robust retry and failure management
5. **Performance Monitoring**: Track delivery metrics at scale

### Future Subscriber Delivery Flow
```typescript
export async function sendDailyNewsletter(): Promise<BatchDeliveryResult> {
  // 1. Get today's topic for System Design subject
  const todaysTopic = await getTodaysTopicForDelivery();
  
  // 2. Get all active subscribers ready for this topic
  const subscribers = await getSubscribersReadyForTopic(todaysTopic.id);
  
  // 3. Batch process deliveries to respect rate limits
  const batchSize = 50; // SES rate limit consideration
  const batches = chunkArray(subscribers, batchSize);
  
  const results = [];
  for (const batch of batches) {
    const batchResult = await processBatchDelivery(batch, todaysTopic);
    results.push(batchResult);
    
    // Rate limiting delay between batches
    await delay(1000); // 1 second between batches
  }
  
  return aggregateResults(results);
}
```

### Delivery Performance Optimization
- **Connection Pooling**: Reuse SMTP connections
- **Parallel Processing**: Send to multiple recipients simultaneously
- **Queue Management**: Use Redis/BullMQ for delivery queue
- **Error Recovery**: Automatic retry with exponential backoff
- **Monitoring**: Real-time delivery status tracking

## Email Client Compatibility

### Supported Email Clients
- **Webmail**: Gmail, Outlook.com, Yahoo Mail
- **Desktop**: Outlook 2016+, Apple Mail, Thunderbird
- **Mobile**: iOS Mail, Android Gmail, Samsung Email
- **Enterprise**: Office 365, Google Workspace

### Template Testing
- **Litmus/Email on Acid**: Cross-client rendering tests
- **Dark Mode Support**: Ensure readability in dark themes
- **Accessibility**: Proper semantic HTML and ARIA labels
- **Loading Performance**: Optimize for slow connections

## Business Impact Metrics

### Delivery Success Metrics
- **Delivery Rate**: 99%+ successful delivery to valid addresses
- **Inbox Placement**: >90% inbox delivery (not spam folder)
- **Template Rendering**: 100% compatibility across major email clients
- **Load Time**: <3 seconds average email load time

### Engagement Metrics (Future)
- **Open Rate**: Target 30%+ (industry average: 21%)
- **Click-Through Rate**: Target 5%+ (industry average: 2.6%)
- **Forward Rate**: Measure content sharing and virality
- **Time Reading**: Average time spent reading newsletter content

### Operational Metrics
- **Cost per Email**: <$0.001 per email sent
- **Delivery Speed**: <10 minutes from trigger to inbox
- **Error Rate**: <1% failed deliveries
- **Support Tickets**: Minimal email-related customer support

## Future Enhancements

### Advanced Features
- **Personalization**: Dynamic content based on subscriber profile
- **A/B Testing**: Test subject lines and content variations
- **Send Time Optimization**: Deliver at optimal time per subscriber
- **Interactive Content**: AMP emails with interactive elements

### Analytics and Insights
- **Heat Maps**: Track which content sections get most attention
- **Device Analytics**: Optimize for most common devices
- **Geographic Insights**: Regional engagement patterns
- **Cohort Analysis**: Track subscriber lifecycle engagement

### Integration Capabilities
- **CRM Integration**: Sync with customer relationship management
- **Analytics Platforms**: Connect to Google Analytics, Mixpanel
- **Social Sharing**: Easy sharing to LinkedIn, Twitter, etc.
- **Feedback Collection**: Direct newsletter rating and feedback