# Mass Marketing Email System Implementation Plan

## Overview
Implement a mass transactional email system that leverages existing newsletter infrastructure to send marketing campaigns to all active subscribers with efficient batching, duplicate prevention, and comprehensive analytics tracking.

## Database Schema Changes

### 1. Extend `transactionalEmails` Table
- Add `campaignId` field (optional string) to schema
- Use existing `emailType` field with new "marketing" type
- Duplicate prevention through `userId + emailType + campaignId` combination

### 2. Campaign ID Validation Schema
**Location**: `src/server/db/schema/transactionalEmails.ts`
- Create `CampaignIdSchema` with z.enum for valid campaign IDs
- Export `CampaignId` type for type safety
- Start with "launch-announcement-2025"

## Core Implementation

### 3. Message Tags Enhancement
**Location**: `src/server/email/constants/messageTagNames.ts`
- Add `MESSAGE_TAG_NAMES.CAMPAIGN_ID = "campaign_id"`
- Add `MESSAGE_TAG_NAMES.USER_ID = "user_id"`

### 4. Repository Methods
**Location**: `src/server/db/repo/transactionalEmailRepo.ts`
- `getUsersWhoReceivedCampaign(userIds: string[], emailType: TransactionalEmailType, campaignId: string): Promise<Set<string>>`
- Bulk query to check which users already received specific campaign

### 5. Email Templates
**Location**: `src/server/email/templates/launchAnnouncement.ts`
- `getLaunchAnnouncementContent(): { subject: string; htmlContent: string; textContent: string; }`
- Store email content as TypeScript modules

### 6. Campaign Generator Methods
**Location**: `src/server/email/transactional/launchAnnouncement.ts`
- `generateLaunchAnnouncementEmails(campaignId: CampaignId): Promise<EmailSendRequest[]>`
- Paginated user processing: `userService.getUsersWithActiveSubscription(page, BATCH_SIZE)`
- Bulk duplicate checking for each user batch
- Generate EmailSendRequests with all required message tags
- 500 user batch size for DB queries

### 7. EmailService Enhancement
**Location**: `src/server/email/emailService.ts`
- `sendMarketingCampaign(emailRequests: EmailSendRequest[], emailType: TransactionalEmailType, campaignId: CampaignId): Promise<BulkEmailSendResponse>`
- Reuses existing bulk email sending infrastructure
- SES rate limiting with existing batch size (14 emails)

### 8. tRPC Procedures
**Location**: `src/server/api/routers/admin.ts` (or new marketing router)
- `sendMassEmail` procedure with CampaignIdSchema and TransactionalEmailTypeSchema validation
- `previewMassEmail` procedure for recipient count and content preview

### 9. Admin Interface Enhancement
**Location**: Admin dashboard component
- Simple trigger button for campaign sending
- Confirmation dialog before execution
- Results display showing sent/failed counts

## Processing Flow

### Campaign Execution
1. Admin triggers campaign via tRPC procedure
2. Validate campaignId and emailType with Zod schemas
3. Call campaign generator method
4. Generator paginates through users (500 per batch)
5. Bulk check duplicates for each user batch
6. Filter eligible users and create EmailSendRequests
7. Pass complete request array to sendMarketingCampaign
8. Service handles SES batching and delivery tracking
9. Return BulkEmailSendResponse with results

### Duplicate Prevention
- Check `transactionalEmails` table for existing records
- Use bulk queries to avoid N+1 performance issues
- Skip users who already received specific campaign
- Track campaign completion at individual user level

### Analytics Integration
- Use transactional email configuration set
- Message tags: email_type, campaign_id, user_id
- Leverage existing SES analytics infrastructure
- Campaign-specific metrics through campaign_id grouping

## File Structure
```
src/server/email/
├── templates/
│   └── launchAnnouncement.ts
├── transactional/
│   └── launchAnnouncement.ts
├── constants/
│   └── messageTagNames.ts (enhanced)
└── emailService.ts (enhanced)

src/server/db/
├── schema/
│   └── transactionalEmails.ts (enhanced)
└── repo/
    └── transactionalEmailRepo.ts (enhanced)

docs/technical/
└── mass-marketing-email-implementation.md
```

## Success Criteria
- Send launch announcement to all active subscribers
- Zero duplicate sends through validation
- Efficient processing with minimal DB queries
- Comprehensive analytics through message tags
- Reusable system for future marketing campaigns
- Type-safe campaign ID management