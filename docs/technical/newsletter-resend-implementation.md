# Newsletter Resend Implementation Plan

## Overview
Implement a newsletter resend system for failed deliveries in the existing admin dashboard, leveraging the current email service infrastructure.

## Requirements Summary
- Display newsletter metrics for 5 most recent newsletter sends in reverse chronological order
- Show metrics: total deliveries, sent, pending, failed, success rate
- Color coding: Green background for 100% success rate, Red otherwise
- Expandable component on click to show failed user IDs
- Resend button with confirmation modal for failed/pending users
- Use existing `sendNewsletterIssue` method with batching and rate limiting
- Update existing delivery records instead of creating new ones

## Delivery Status Classification
Based on existing schema (`deliveries.status` enum):
- **Total**: All delivery records for an issue (includes all statuses)
- **Sent**: `sent` + `delivered` statuses
- **Pending**: `pending` status
- **Failed**: `failed` + `bounced` statuses
- **Success Rate**: sent / total

## Implementation Plan

### Phase 0: Use Existing Sequence Numbers

#### Leverage `topics.sequenceOrder` for Issue Numbers:
- Use existing `topics.sequenceOrder` field as the advertiser-facing issue number
- No schema changes needed - join with topics table to get sequence number
- `issue_id` remains the database primary key, `topics.sequenceOrder` becomes the advertiser-facing identifier
- Update newsletter utilities to pass `topics.sequenceOrder` as the issue number for message tags

### Phase 1: Database Repository Layer

#### Add new methods to `deliveryRepo.ts`:

```typescript
// Get aggregated metrics for recent newsletter issues
async findRecentIssueMetrics(limit: number = 5): Promise<NewsletterMetrics[]>

// Get user IDs with failed/pending deliveries for a specific issue
async findFailedDeliveryUserIds(issueId: number): Promise<string[]>

// Get detailed stats for a specific issue
async getIssueDeliveryStats(issueId: number): Promise<IssueDeliveryStats>
```

#### Data structures:
```typescript
interface NewsletterMetrics {
  issueId: number;
  issueTitle: string;
  sentAt: Date | null;
  total: number;      // All delivery records
  sent: number;       // 'sent' + 'delivered'
  pending: number;    // 'pending'
  failed: number;     // 'failed' + 'bounced'
  successRate: number; // sent / total
}

interface IssueDeliveryStats {
  total: number;
  sent: number;
  pending: number;
  failed: number;
  successRate: number;
  failedUserIds: string[];
}
```

### Phase 2: Service Layer (DeliveryService)

#### Create new `DeliveryService` class with methods:

```typescript
class DeliveryService {
  // Get metrics for recent newsletter issues
  async getRecentNewsletterMetrics(limit: number = 5): Promise<NewsletterMetrics[]>

  // Get failed/pending users for resend
  async getFailedDeliveryUsers(issueId: number): Promise<string[]>

  // Get detailed stats for a specific issue
  async getNewsletterDeliveryStats(issueId: number): Promise<IssueDeliveryStats>

  // Resend newsletter to failed users (main resend logic)
  async resendNewsletterToFailedUsers(issueId: number): Promise<BulkEmailSendResponse>
}
```

### Phase 3: tRPC Procedures

#### Add new procedures to newsletter router:

```typescript
// Query procedures
getRecentNewsletterMetrics: adminProcedure
  .input(z.object({ limit: z.number().optional().default(5) }))
  .query()

getFailedDeliveryUsers: adminProcedure
  .input(z.object({ issueId: z.number() }))
  .query()

// Mutation procedure
resendNewsletterIssueToFailedUsers: adminProcedure
  .input(z.object({ issueId: z.number() }))
  .mutation()
```

### Phase 4: Frontend Components

#### Create new React components:

1. **`NewsletterMetricsDashboard.tsx`** - Main dashboard component
   - Displays 5 most recent newsletter sends
   - Shows metrics cards with color coding
   - Handles expand/collapse functionality

2. **`NewsletterMetricsCard.tsx`** - Individual newsletter metrics card
   - Shows issue title, send date, and metrics
   - Green/red background based on success rate
   - Click to expand and show failed users

3. **`FailedUsersModal.tsx`** - Modal showing failed delivery users
   - Lists failed user IDs
   - Resend button with confirmation flow

4. **`ResendConfirmationModal.tsx`** - Confirmation modal for resends
   - Similar to marketing email confirmation flow
   - Shows resend details and warnings

### Phase 5: Integration

#### Admin Dashboard Integration:
- Add `NewsletterMetricsDashboard` to existing admin dashboard
- Place above or below current newsletter management section
- Maintain consistent styling with existing components

## Technical Implementation Details

### 1. Resend Logic Flow
1. Validate issue exists in database
2. Get failed/pending delivery user IDs via `getFailedDeliveryUsers`
3. Build `SendNewsletterRequest` with filtered user list
4. Use existing `sendNewsletterIssue` method for actual sending
5. Update existing delivery records (clear error messages, update timestamps)
6. Return success/failure results

### 2. Database Query Optimization
- Use efficient SQL aggregation queries for metrics
- Leverage existing indexes on `deliveries` table
- Join with `issues` table for issue titles and send dates

### 3. Rate Limiting & Batching
- Leverage existing `sendNewsletterIssue` method's batching logic (BULK_EMAIL_SIZE)
- Use existing rate limiting from email service (AWS_SES_RATE_LIMIT)
- Process resends in same batch sizes as original sends

### 4. Delivery Record Updates
- Update existing delivery records instead of creating new ones
- Clear `errorMessage` field on successful resend
- Update `sentAt` timestamp for successful resends
- Preserve original `createdAt` for audit trail
- Handle cases where users are no longer subscribed

### 5. Error Handling
- Validate issue exists before resend
- Provide clear error messages for failed resends
- Log resend attempts for debugging
- Handle edge cases (no failed users, already all sent, etc.)

## Security & Authorization
- All resend endpoints require admin authentication
- Validate issue ownership/permissions
- Rate limit resend requests to prevent abuse
- Sanitize error messages displayed in UI

## Success Metrics
- Ability to view recent newsletter send metrics
- Accurate failed user identification and resend functionality
- Proper delivery record updates without creating duplicates
- Smooth UX with loading states and error handling
- Consistent styling with existing admin dashboard

## Implementation Order
1. **Backend Foundation** - Repository methods, DeliveryService, tRPC procedures
2. **Frontend Components** - Dashboard, metrics cards, modals
3. **Integration** - Add to admin dashboard, connect to APIs
4. **Testing & Polish** - Edge case handling, error states, styling consistency

## Files to Modify/Create

### New Files:
- `src/server/newsletter/DeliveryService.ts`
- `src/app/_components/NewsletterMetricsDashboard.tsx`
- `src/app/_components/NewsletterMetricsCard.tsx`
- `src/app/_components/FailedUsersModal.tsx`
- `src/app/_components/ResendConfirmationModal.tsx`

### Modified Files:
- `src/server/db/repo/deliveryRepo.ts` - Add new query methods
- `src/server/api/routers/newsletter.ts` - Add new tRPC procedures
- `src/app/admin/page.tsx` - Integrate newsletter metrics dashboard

## Estimated Implementation
- **Repository methods**: ~50 lines of code
- **DeliveryService class**: ~100 lines of code
- **tRPC procedures**: ~75 lines of code
- **Frontend components**: ~300 lines of code
- **Integration**: ~25 lines of code

**Total**: ~550 lines of new code leveraging existing robust email infrastructure.