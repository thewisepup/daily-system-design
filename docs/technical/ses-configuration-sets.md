# AWS SES Configuration Sets and Message Tags Implementation

## Overview
Implementation of AWS SES configuration sets and message tags to enable tracking of newsletter metrics at both user and issue levels.

## Technical Requirements

### MessageTag Structure
- **Name**: String (max 256 characters, alphanumeric + underscore + dash only)
- **Value**: String (max 256 characters, alphanumeric + underscore + dash only)

### Tracking Levels
- **User Level**: Track email delivery/engagement per `userId`
- **Subject Level**: Track newsletter performance per `subjectId` (e.g., "System Design")
- **Issue Level**: Track specific topic performance per `issue_number` (maps to `topic_ord`)

## Implementation Changes

### 1. Email Types Updates (`src/server/email/types.ts`)

Add MessageTag interface:
```typescript
export interface MessageTag {
  name: string;
  value: string;
}
```

Update EmailSendRequest:
```typescript
export const EmailSendRequestSchema = z.object({
  // existing fields...
  configurationSet: z.string().optional(),
  tags: z.array(MessageTagSchema).optional(),
});
```

Update BulkEmailSendRequest:
```typescript
export const BulkEmailSendRequestSchema = z.object({
  // existing fields...
  configurationSet: z.string().optional(),
  defaultTags: z.array(MessageTagSchema).optional(),
});
```

### 2. EmailService Changes (`src/server/email/emailService.ts`)

Add tag generation logic:
```typescript
private generateStandardTags(userId: string, subjectId: string, issueNumber?: number): MessageTag[] {
  const tags: MessageTag[] = [
    { name: "user_id", value: userId },
    { name: "subject_id", value: subjectId }
  ];
  
  if (issueNumber) {
    tags.push({ name: "issue_number", value: issueNumber.toString() });
  }
  
  return tags;
}
```

Update sendEmail method to include configuration set and tags.

Update sendBulkEmail method to add standard tags to each email.

### 3. AWS SES Provider Changes (`src/server/email/providers/awsSes.ts`)

Update SendEmailCommand to include:
```typescript
const command = new SendEmailCommand({
  // existing fields...
  ConfigurationSetName: request.configurationSet,
  Tags: request.tags?.map(tag => ({
    Name: tag.name,
    Value: tag.value
  }))
});
```

Update sendRawEmail method to include ConfigurationSetName in SendRawEmailCommand.

Add tag validation to ensure AWS SES compliance.

### 4. Constants Updates (`src/server/email/constants/bulkEmailConstants.ts`)

Add configuration set constants:
```typescript
export const DEFAULT_CONFIGURATION_SET = "daily-system-design-newsletter";
export const STANDARD_TAG_NAMES = {
  USER_ID: "user_id",
  SUBJECT_ID: "subject_id",
  ISSUE_NUMBER: "issue_number"
} as const;
```

## Usage Examples

### Single Email with Tags
```typescript
await emailService.sendEmail({
  to: "user@example.com",
  from: "newsletter@daily-system-design.com",
  subject: "Daily Newsletter",
  html: "<html>...</html>",
  userId: "user123",
  configurationSet: "daily-system-design-newsletter",
  tags: [
    { name: "user_id", value: "user123" },
    { name: "subject_id", value: "system-design" },
    { name: "issue_number", value: "42" }
  ]
});
```

### Bulk Email with Configuration Set
```typescript
await emailService.sendBulkEmail({
  entries: [...],
  from: "newsletter@daily-system-design.com",
  issue_id: 42,
  configurationSet: "daily-system-design-newsletter",
  defaultTags: [
    { name: "subject_id", value: "system-design" },
    { name: "issue_number", value: "42" }
  ]
});
```

## AWS SES Configuration Set Setup

The configuration set `daily-system-design-newsletter` must be created in AWS SES with:
- Event publishing enabled for delivery, bounce, complaint, and click events
- Destination configured (CloudWatch, SNS, or Kinesis Data Firehose)

## Backwards Compatibility

All changes are backwards compatible:
- `configurationSet` and `tags` parameters are optional
- Existing email sending code continues to work without modification
- Default behavior remains unchanged when parameters are not provided